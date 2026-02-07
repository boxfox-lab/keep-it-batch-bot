import fs from 'fs';
import OpenAI from 'openai';
import { SiteEntity } from 'src/entity/keep-it';
import { SiteJobCacheService } from './site-job-cache.service';
import { LANGUAGE_PROMPTS } from './language-prompts';
import { BatchJobResponse } from './site.dto';
import { GlobalErrorHandler } from 'src/util/error/global-error-handler';

export class StartSiteJobService {
  constructor(
    private readonly openai: OpenAI,
    private readonly cache: SiteJobCacheService,
  ) {}

  async start(sites: SiteEntity[]) {
    const batchFilePath = await this.makeBatchFile(sites);
    const batchJob = await this.createAndRunBatchJob(batchFilePath);

    await this.cache.saveBatchJobCache(batchJob.id);
    await this.cache.addProcessingSites(sites.map((site) => site.id));

    return batchJob;
  }

  private async makeBatchFile(sites: SiteEntity[]) {
    const batchFilePath = 'site-batch.jsonl';
    const text = sites
      .map((site) => JSON.stringify(this.makeRow(site)))
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

      console.log(`사이트 분석 배치 작업이 생성되었습니다. ID: ${batchJob.id}`);
      return batchJob;
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'StartSiteJobService.createAndRunBatchJob',
        { batchFilePath },
      );
      throw error;
    }
  }

  public makeRow(site: SiteEntity): {
    custom_id: string;
    method: string;
    url: string;
    body: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;
  } {
    const lang = site.lang || 'en';
    const prompts = LANGUAGE_PROMPTS[lang] || LANGUAGE_PROMPTS.en;

    const body: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming =
      {
        model: 'gpt-4.1-nano',
        messages: [
          {
            role: 'system',
            content: prompts.system,
          },
          {
            role: 'user',
            content: [
              '다음 사이트의 내용을 요약해주세요',
              `제목: ${site.title}`,
              `사이트명: ${site.siteName}`,
              `설명: ${site.description}`,
              `HTML 내용: ${site.html}`,
            ].join('\n'),
          },
        ],
        functions: [
          {
            name: 'analyze_site',
            description: prompts.function_description,
            parameters: {
              type: 'object',
              properties: {
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
                reading_time: {
                  type: 'number',
                  description: prompts.reading_time_desc,
                },
              },
              required: ['main_points', 'qa', 'summary', 'reading_time'],
            },
          },
        ],
        function_call: { name: 'analyze_site' },
        max_tokens: 1000,
      };

    return {
      custom_id: `summary-site-${site.id}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body,
    };
  }
}
