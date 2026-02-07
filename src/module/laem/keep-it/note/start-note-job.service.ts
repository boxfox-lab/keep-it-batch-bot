import fs from 'fs';
import OpenAI from 'openai';
import { FolderEntity, NoteEntity, SiteEntity } from 'src/entity/keep-it';
import { LANGUAGE_PROMPTS } from './language-prompts';
import { NoteJobCacheService } from './note-job-cache.service';
import { BatchJobResponse } from './note.dto';
import { GlobalErrorHandler } from 'src/util/error/global-error-handler';

export class StartNoteJobService {
  constructor(
    private readonly openai: OpenAI,
    private readonly cache: NoteJobCacheService,
  ) {}

  async start(
    notes: NoteEntity[],
    folders: Record<number, FolderEntity[]>,
    sites: Record<number, SiteEntity[]>,
  ) {
    const batchFilePath = await this.makeBatchFile(notes, folders, sites);
    const batchJob = await this.createAndRunBatchJob(batchFilePath);

    // 배치 작업 ID를 캐시에 저장 (카테고리 포함)
    await this.cache.saveBatchJobCache(batchJob.id);

    await this.cache.addProcessingNotes(notes.map((note) => note.id));
  }

  private async makeBatchFile(
    notes: NoteEntity[],
    folders: Record<number, FolderEntity[]>,
    sites: Record<number, SiteEntity[]>,
  ) {
    const batchFilePath = 'batch.jsonl';
    const text = notes
      .map((note) =>
        JSON.stringify(
          this.makeRow(note, folders[note.user.id], sites[note.id]),
        ),
      )
      .join('\n');
    fs.writeFileSync(batchFilePath, text, { encoding: 'utf8' });
    return batchFilePath;
  }

  private async createAndRunBatchJob(
    batchFilePath: string,
  ): Promise<BatchJobResponse> {
    try {
      // 1. 파일 업로드
      const file = await this.openai.files.create({
        file: fs.createReadStream(batchFilePath, { encoding: 'utf8' }),
        purpose: 'batch',
      });

      // 2. 배치 작업 생성 및 실행
      const batchJob = await this.openai.batches.create({
        input_file_id: file.id,
        endpoint: '/v1/chat/completions',
        completion_window: '24h',
      });

      console.log(`노트 분석 배치 작업이 생성되었습니다. ID: ${batchJob.id}`);
      return batchJob;
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'StartNoteJobService.createAndRunBatchJob',
        { batchFilePath },
      );
      throw error;
    }
  }

  public makeRow(
    note: NoteEntity,
    folders: FolderEntity[],
    sites: SiteEntity[],
  ): {
    custom_id: string;
    method: string;
    url: string;
    body: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;
  } {
    const lang = note.lang || 'en';
    const prompts = LANGUAGE_PROMPTS[lang] || LANGUAGE_PROMPTS.en;

    const properties: any = {
      main_points: {
        type: 'array',
        items: { type: 'string' },
        description: prompts.main_points_desc,
      },
      qa: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            answer: { type: 'string' },
          },
          required: ['question', 'answer'],
        },
        description: prompts.qa_desc,
      },
      summary: {
        type: 'string',
        description: prompts.summary_desc,
      },
    };

    const required = ['main_points', 'qa', 'summary'];

    // 폴더가 비어있는 경우에만 폴더 추천 추가
    if (!note.folder) {
      properties.folder = {
        type: 'object',
        properties: {
          name: { type: 'string', description: prompts.folder_name_desc },
          description: {
            type: 'string',
            description: prompts.folder_description_desc,
          },
        },
        required: ['name', 'description'],
        description: prompts.folder_desc,
      };
      required.push('folder');
    }

    // 태그가 비어있는 경우에만 태그 추천 추가
    if (!note.tags || note.tags.length === 0) {
      properties.tags = {
        type: 'array',
        items: { type: 'string' },
        description: prompts.tags_desc,
      };
      required.push('tags');
    }

    const body: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming =
      {
        model: 'gpt-3.5-turbo-0125',
        messages: [
          {
            role: 'system',
            content: prompts.system,
          },
          {
            role: 'user',
            content: [
              '다음 노트의 내용을 요약해주세요',
              `내용: ${note.content}`,
              note.folder
                ? `유저가 선택한 폴더: ${note.folder.name}`
                : undefined,
              note.tags.length
                ? `유저가 선택한 태그: ${note.tags.join(', ')}`
                : undefined,
              !note.folder && folders && folders.length > 0
                ? `기존 폴더 목록: ${folders
                    .map((f) => f.name)
                    .join(
                      ', ',
                    )} (중요: 폴더를 추천할 때는 먼저 이 목록에서 적절한 폴더를 찾아 재사용하세요. 만약 이 목록에 적절한 폴더가 없다면, 새로운 폴더를 추천해주세요.)`
                : undefined,
              sites?.length
                ? `유저가 첨부한 사이트 목록:\n${sites
                    .filter((site) => !!site)
                    .map(
                      (site, idx) =>
                        `${idx + 1}번 사이트 : ${JSON.stringify({
                          title: site.title,
                          summary: site.summary,
                          qa: site.qa,
                        })}`,
                    )
                    .join('\n')}`
                : undefined,
              note.images.length
                ? `유저가 첨부한 이미지에 대한 요약들 : ${note.images.map((i) =>
                    JSON.stringify({ summary: i.aiSummary, qa: i.qa }),
                  )}`
                : undefined,
            ]
              .filter(Boolean)
              .join('\n'),
          },
        ],
        functions: [
          {
            name: 'summarize_note',
            description: prompts.function_description,
            parameters: {
              type: 'object',
              properties,
              required,
            },
          },
        ],
        function_call: { name: 'summarize_note' },
        max_tokens: 1000,
      };
    return {
      custom_id: `summary-note-${note.id}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body,
    };
  }
}
