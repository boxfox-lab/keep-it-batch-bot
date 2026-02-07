import OpenAI from 'openai';
import { NoteEntity, NoteHistoryEntity } from 'src/entity/keep-it';
import { Repository } from 'typeorm';
import { FolderUtilService } from './folder-util.service';
import { NoteJobCacheService } from './note-job-cache.service';
import { NotifyService } from '../notify/notify.service';
import { StartNoteJobService } from './start-note-job.service';
import { GlobalErrorHandler } from 'src/util/error/global-error-handler';
import { NoteHistoryType } from 'src/models/NoteHistoryType';

interface BatchJobOutput {
  custom_id: string;
  response: {
    status_code: number;
    request_id: string;
    body: {
      id: string;
      choices: Array<{
        index: number;
        message: {
          role: string;
          content: string;
          function_call: {
            name: string;
            arguments: string;
          };
        };
        finish_reason: string;
      }>;
      created: number;
      model: string;
    };
    service_tier: 'default';
    system_fingerprint: null;
  };
}

interface NoteSummaryResponse {
  main_points: string[];
  qa: {
    question: string;
    answer: string;
  }[];
  summary: string;
  folder?: {
    name: string;
    description: string;
  };
  tags?: string[];
}

export class ProcessNoteJobService {
  private readonly MAX_JOB_DURATION = 10 * 60 * 1000; // 10분 (밀리초)

  constructor(
    private readonly openai: OpenAI,
    private readonly noteRepo: Repository<NoteEntity>,
    private readonly noteHistoryRepo: Repository<NoteHistoryEntity>,
    private readonly folderService: FolderUtilService,
    private readonly cache: NoteJobCacheService,
    private readonly notifyService: NotifyService,
    private readonly startNoteJobService: StartNoteJobService,
  ) {}

  async process() {
    try {
      // 1. 진행 중인 배치 작업 조회
      const batchJobCache = await this.cache.getBatchJobCache();

      for (const cache of batchJobCache) {
        const jobId = cache.value;
        try {
          // 2. 배치 작업 상태 확인
          const jobResult = await this.getBatchJobResult(jobId);

          // 작업 시작 시간 확인
          const jobStartTime = new Date(jobResult.created_at * 1000).getTime();
          const currentTime = Date.now();
          const jobDuration = currentTime - jobStartTime;

          if (jobDuration > this.MAX_JOB_DURATION) {
            console.log(
              `노트 분석 배치 작업 ${jobId}가 10분을 초과하여 취소합니다.`,
            );

            // 배치 작업 취소 전에 처리할 노트 ID 목록 가져오기
            const results = await this.downloadBatchResults(
              jobResult.input_file_id,
            );
            const noteIds = results.map((result) =>
              Number(result.custom_id.replace('summary-note-', '')),
            );

            // 배치 작업 취소 및 캐시에서 제거
            await this.cancelBatchJob(jobId);
            await this.cache.deleteBatchJobCache(jobId);
            await this.cache.removeProcessingNotes(noteIds);

            // 취소된 작업의 노트들을 일반 API로 즉시 처리
            await this.processCancelledNotes(noteIds);
            continue;
          }

          if (jobResult.status === 'completed' && jobResult.output_file_id) {
            // 3. 완료된 작업의 결과 파일 다운로드
            const results = await this.downloadBatchResults(
              jobResult.output_file_id,
            );

            // 4. 결과 처리
            await this.processBatchResults(results);

            // 5. 처리 완료된 배치 작업 ID를 캐시에서 제거
            await this.cache.deleteBatchJobCache(jobId);

            console.log(`노트 분석 배치 작업 ${jobId} 처리 완료 및 캐시 제거`);
          } else if (jobResult.status === 'failed') {
            await GlobalErrorHandler.handleError(
              new Error(`노트 분석 배치 작업 ${jobId} 실패`),
              'ProcessNoteJobService.process',
              { jobId, status: jobResult.status },
            );
            // 실패한 작업도 캐시에서 제거
            await this.cache.deleteBatchJobCache(jobId);

            // 실패한 작업의 노트 ID도 처리 중인 목록에서 제거
            const results = await this.downloadBatchResults(
              jobResult.output_file_id,
            );
            const failedIds = results.map((result) =>
              Number(result.custom_id.replace('summary-note-', '')),
            );
            await this.cache.removeProcessingNotes(failedIds);
          }
        } catch (error) {
          await GlobalErrorHandler.handleError(
            error as Error,
            'ProcessNoteJobService.process',
            { jobId },
          );
        }
      }
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'ProcessNoteJobService.process',
      );
      throw error;
    }
  }

  private async getBatchJobResult(
    jobId: string,
  ): Promise<OpenAI.Batches.Batch> {
    console.log('jobId', jobId);
    return await this.openai.batches.retrieve(jobId);
  }

  private async cancelBatchJob(jobId: string) {
    try {
      await this.openai.batches.cancel(jobId);
      console.log(`배치 작업 ${jobId} 취소 완료`);
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'ProcessNoteJobService.cancelBatchJob',
        { jobId },
      );
    }
  }

  private async processCancelledNotes(noteIds: number[]) {
    console.log(
      `취소된 작업의 ${noteIds.length}개 노트를 일반 API로 처리합니다.`,
    );

    for (const noteId of noteIds) {
      try {
        const note = await this.noteRepo.findOne({
          where: { id: noteId },
          relations: ['user', 'folder', 'images'],
        });

        if (!note) {
          await GlobalErrorHandler.handleError(
            new Error(`노트 ID ${noteId}를 찾을 수 없습니다.`),
            'ProcessNoteJobService.processCancelledNotes',
            { noteId },
          );
          continue;
        }

        // 사용자의 기존 폴더 목록 조회
        const userFolders = await this.folderService.getFolders([note.user.id]);
        const folders = userFolders[note.user.id] || [];

        const row = this.startNoteJobService.makeRow(note, folders, []);
        const response = await this.openai.chat.completions.create(row.body);

        const functionCall = response.choices[0].message.function_call;
        if (functionCall && functionCall.name === 'summarize_note') {
          const result = JSON.parse(
            functionCall.arguments,
          ) as NoteSummaryResponse;

          await this.updateNoteSummary(note, result);
          console.log(`노트 ID ${noteId} 분석 완료`);
        }
      } catch (error) {
        await GlobalErrorHandler.handleError(
          error as Error,
          'ProcessNoteJobService.processCancelledNotes',
          { noteId },
        );
      }
    }

    // 처리 완료된 노트 ID 목록에서 제거
    await this.cache.removeProcessingNotes(noteIds);
  }

  private async downloadBatchResults(
    fileId: string,
  ): Promise<BatchJobOutput[]> {
    const response = await this.openai.files.retrieveContent(fileId);
    const results: BatchJobOutput[] = [];

    // JSONL 파일을 라인별로 파싱
    const lines = response.split('\n').filter((line) => line.trim());
    for (const line of lines) {
      try {
        results.push(JSON.parse(line));
      } catch (error) {
        await GlobalErrorHandler.handleError(
          error as Error,
          'ProcessNoteJobService.downloadBatchResults',
          { fileId, line },
        );
      }
    }

    return results;
  }

  private async processBatchResults(results: BatchJobOutput[]) {
    const processedNoteIds: number[] = [];

    for (const result of results) {
      try {
        const functionCall =
          result.response.body.choices[0].message.function_call;
        if (functionCall && functionCall.name === 'summarize_note') {
          const summary = JSON.parse(
            functionCall.arguments,
          ) as NoteSummaryResponse;

          // custom_id에서 note ID 추출 (summary-note-{id} 형식)
          const id = Number(result.custom_id.replace('summary-note-', ''));
          processedNoteIds.push(id);

          const note = await this.noteRepo.findOne({
            where: { id },
            relations: ['user', 'folder', 'images'],
          });

          if (note) {
            await this.updateNoteSummary(note, summary);
          }
        }
      } catch (error) {
        await GlobalErrorHandler.handleError(
          error as Error,
          'ProcessNoteJobService.processBatchResults',
          { customId: result.custom_id },
        );
      }
    }

    if (processedNoteIds.length > 0) {
      // 처리 완료된 노트 ID 목록에서 제거
      await this.cache.removeProcessingNotes(processedNoteIds);
      console.log(
        `${processedNoteIds.length}개의 노트 요약이 업데이트되었습니다.`,
      );
    }
  }

  private async updateNoteSummary(
    note: NoteEntity,
    summary: NoteSummaryResponse,
  ) {
    try {
      // 노트 요약 업데이트
      note.aiSummary = summary.summary;
      note.qa = summary.qa;

      if (!note.folder && summary.folder) {
        const newFolders = await this.folderService.makeNewFolders([
          {
            uid: note.user.id,
            folder: summary.folder,
          },
        ]);
        if (newFolders.length > 0) {
          note.folder = newFolders[0];
        }
      }

      // 태그 추천이 있는 경우 처리
      if (summary.tags && summary.tags.length > 0) {
        note.tags = [...new Set([...note.tags, ...summary.tags])];
      }

      await this.noteRepo.save(note);
      await this.noteHistoryRepo.save({
        note: note,
        user: note.user,
        type: NoteHistoryType.UPDATE,
      });

      // 알림 전송
      await this.notifyService.send({
        user: note.user,
        title: '노트 분석 완료',
        message: `"${note.content?.substring(
          0,
          50,
        )}..." 노트의 분석이 완료되었습니다.`,
        tag: 'summary_finished',
      });
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'ProcessNoteJobService.updateNoteSummary',
        { noteId: note.id },
      );
    }
  }
}
