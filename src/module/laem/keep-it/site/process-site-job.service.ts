import OpenAI from 'openai';
import { SiteJobCacheService } from './site-job-cache.service';
import { SiteUtilService } from './site-util.service';
import { StartSiteJobService } from './start-site-job.service';
import { GlobalErrorHandler } from 'src/util/error/global-error-handler';

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

interface SiteSummaryResponse {
  main_points: string[];
  qa: {
    question: string;
    answer: string;
  }[];
  summary: string;
  reading_time: number;
}

interface SiteSummaryUpdate {
  id: number;
  summary: string;
  qa: { question: string; answer: string }[];
}

export class ProcessSiteJobService {
  private readonly MAX_JOB_DURATION = 10 * 60 * 1000; // 10분 (밀리초)

  constructor(
    private readonly openai: OpenAI,
    private readonly cache: SiteJobCacheService,
    private readonly siteService: SiteUtilService,
    private readonly startSiteJobService: StartSiteJobService,
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
              `사이트 분석 배치 작업 ${jobId}가 10분을 초과하여 취소합니다.`,
            );

            // 배치 작업 취소 전에 처리할 사이트 ID 목록 가져오기
            const results = await this.downloadBatchResults(
              jobResult.input_file_id,
            );
            const siteIds = results.map((result) =>
              Number(result.custom_id.replace('summary-site-', '')),
            );

            // 배치 작업 취소 및 캐시에서 제거
            await this.cancelBatchJob(jobId);
            await this.cache.deleteBatchJobCache(jobId);
            await this.cache.removeProcessingSites(siteIds);

            // 취소된 작업의 사이트들을 일반 API로 즉시 처리
            await this.processCancelledSites(siteIds);
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

            console.log(
              `사이트 분석 배치 작업 ${jobId} 처리 완료 및 캐시 제거`,
            );
          } else if (jobResult.status === 'failed') {
            await GlobalErrorHandler.handleError(
              new Error(`사이트 분석 배치 작업 ${jobId} 실패`),
              'ProcessSiteJobService.process',
              { jobId, status: jobResult.status },
            );
            // 실패한 작업도 캐시에서 제거
            await this.cache.deleteBatchJobCache(jobId);

            // 실패한 작업의 사이트 ID도 처리 중인 목록에서 제거
            const results = await this.downloadBatchResults(
              jobResult.output_file_id,
            );
            const failedIds = results.map((result) =>
              Number(result.custom_id.replace('summary-site-', '')),
            );
            await this.cache.removeProcessingSites(failedIds);
          }
        } catch (error) {
          await GlobalErrorHandler.handleError(
            error as Error,
            'ProcessSiteJobService.process',
            { jobId },
          );
        }
      }
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'ProcessSiteJobService.process',
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
        'ProcessSiteJobService.cancelBatchJob',
        { jobId },
      );
    }
  }

  private async processCancelledSites(siteIds: number[]) {
    console.log(
      `취소된 작업의 ${siteIds.length}개 사이트를 일반 API로 처리합니다.`,
    );

    const summaryUpdates: SiteSummaryUpdate[] = [];

    for (const siteId of siteIds) {
      try {
        const site = await this.siteService.getSiteById(siteId);
        if (!site) {
          await GlobalErrorHandler.handleError(
            new Error(`사이트 ID ${siteId}를 찾을 수 없습니다.`),
            'ProcessSiteJobService.processCancelledSites',
            { siteId },
          );
          continue;
        }

        const row = this.startSiteJobService.makeRow(site);
        const response = await this.openai.chat.completions.create(row.body);

        const functionCall = response.choices[0].message.function_call;
        if (functionCall && functionCall.name === 'analyze_site') {
          const result = JSON.parse(functionCall.arguments);

          summaryUpdates.push({
            id: siteId,
            summary: result.summary,
            qa: result.qa,
          });

          console.log(`사이트 ID ${siteId} 분석 완료`);
        }
      } catch (error) {
        await GlobalErrorHandler.handleError(
          error as Error,
          'ProcessSiteJobService.processCancelledSites',
          { siteId },
        );
      }
    }

    if (summaryUpdates.length > 0) {
      await this.siteService.bulkUpdateSiteSummary(summaryUpdates);
      console.log(
        `${summaryUpdates.length}개의 사이트 요약이 일괄 업데이트되었습니다.`,
      );
    }

    // 처리 완료된 사이트 ID 목록에서 제거
    await this.cache.removeProcessingSites(siteIds);
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
          'ProcessSiteJobService.downloadBatchResults',
          { fileId, line },
        );
      }
    }

    return results;
  }

  private async processBatchResults(results: BatchJobOutput[]) {
    const summaryUpdates: SiteSummaryUpdate[] = [];
    const processedSiteIds: number[] = [];

    for (const result of results) {
      try {
        const functionCall =
          result.response.body.choices[0].message.function_call;
        if (functionCall && functionCall.name === 'analyze_site') {
          const summary = JSON.parse(
            functionCall.arguments,
          ) as SiteSummaryResponse;

          // custom_id에서 site ID 추출 (summary-site-{id} 형식)
          const id = Number(result.custom_id.replace('summary-site-', ''));
          processedSiteIds.push(id);

          summaryUpdates.push({
            id,
            summary: summary.summary,
            qa: summary.qa,
          });
        }
      } catch (error) {
        await GlobalErrorHandler.handleError(
          error as Error,
          'ProcessSiteJobService.processBatchResults',
          { customId: result.custom_id },
        );
      }
    }

    if (summaryUpdates.length > 0) {
      await this.siteService.bulkUpdateSiteSummary(summaryUpdates);
      // 처리 완료된 사이트 ID 목록에서 제거
      await this.cache.removeProcessingSites(processedSiteIds);
      console.log(
        `${summaryUpdates.length}개의 사이트 요약이 업데이트되었습니다.`,
      );
    }
  }
}
