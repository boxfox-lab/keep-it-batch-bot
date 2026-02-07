import OpenAI from 'openai';
import { ImageJobCacheService } from './image-job-cache.service';
import { ImageUtilService } from './image-util.service';
import { StartImageJobService } from './start-image-job.service';
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

interface ImageSummaryResponse {
  summary: string;
  qa: {
    question: string;
    answer: string;
  }[];
}

interface ImageSummaryUpdate {
  id: number;
  summary: string;
  qa: { question: string; answer: string }[];
}

export class ProcessImageJobService {
  private readonly MAX_JOB_DURATION = 10 * 60 * 1000; // 10분 (밀리초)

  constructor(
    private readonly openai: OpenAI,
    private readonly cache: ImageJobCacheService,
    private readonly imageService: ImageUtilService,
    private readonly startImageJobService: StartImageJobService,
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

          if (jobResult.status !== 'completed') {
            // 작업 시작 시간 확인
            const jobStartTime = new Date(
              jobResult.created_at * 1000,
            ).getTime();
            const currentTime = Date.now();
            const jobDuration = currentTime - jobStartTime;

            if (jobDuration > this.MAX_JOB_DURATION) {
              console.log(
                `이미지 분석 배치 작업 ${jobId}가 10분을 초과하여 취소합니다.`,
              );

              // 배치 작업 취소 전에 처리할 이미지 ID 목록 가져오기
              const results = await this.downloadBatchResults(
                jobResult.input_file_id,
              );
              const imageIds = results.map((result) =>
                Number(result.custom_id.replace('summary-image-', '')),
              );

              // 배치 작업 취소 및 캐시에서 제거
              await this.cancelBatchJob(jobId);
              await this.cache.deleteBatchJobCache(jobId);
              await this.cache.removeProcessingImages(imageIds);

              // 취소된 작업의 이미지들을 일반 API로 즉시 처리
              await this.processCancelledImages(imageIds);
              continue;
            }
          }

          if (jobResult.status === 'completed' && jobResult.output_file_id) {
            // 3. 완료된 작업의 결과 파일 다운로드
            const results = await this.downloadBatchResults(
              jobResult.output_file_id,
            );

            console.log(results);

            // 4. 결과 처리
            await this.processBatchResults(results);

            // 5. 처리 완료된 배치 작업 ID를 캐시에서 제거
            await this.cache.deleteBatchJobCache(jobId);

            console.log(
              `이미지 분석 배치 작업 ${jobId} 처리 완료 및 캐시 제거`,
            );
          } else if (jobResult.status === 'failed') {
            await GlobalErrorHandler.handleError(
              new Error(`이미지 분석 배치 작업 ${jobId} 실패`),
              'ProcessImageJobService.process',
              { jobId, status: jobResult.status },
            );
            // 실패한 작업도 캐시에서 제거
            await this.cache.deleteBatchJobCache(jobId);

            // 실패한 작업의 이미지 ID도 처리 중인 목록에서 제거
            const results = await this.downloadBatchResults(
              jobResult.output_file_id,
            );
            const failedIds = results.map((result) =>
              Number(result.custom_id.replace('summary-image-', '')),
            );
            await this.cache.removeProcessingImages(failedIds);
          }
        } catch (error) {
          await GlobalErrorHandler.handleError(
            error as Error,
            'ProcessImageJobService.process',
            { jobId },
          );
        }
      }
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'ProcessImageJobService.process',
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
        'ProcessImageJobService.cancelBatchJob',
        { jobId },
      );
    }
  }

  private async processCancelledImages(imageIds: number[]) {
    console.log(
      `취소된 작업의 ${imageIds.length}개 이미지를 일반 API로 처리합니다.`,
    );

    const summaryUpdates: ImageSummaryUpdate[] = [];

    for (const imageId of imageIds) {
      try {
        const image = await this.imageService.getImageById(imageId);
        if (!image) {
          await GlobalErrorHandler.handleError(
            new Error(`이미지 ID ${imageId}를 찾을 수 없습니다.`),
            'ProcessImageJobService.processCancelledImages',
            { imageId },
          );
          continue;
        }

        const row = this.startImageJobService.makeRow(image);
        const response = await this.openai.chat.completions.create(row.body);

        const functionCall = response.choices[0].message.function_call;
        if (functionCall && functionCall.name === 'analyze_image') {
          const result = JSON.parse(functionCall.arguments);

          summaryUpdates.push({
            id: imageId,
            summary: result.summary,
            qa: result.qa,
          });

          console.log(`이미지 ID ${imageId} 분석 완료`);
        }
      } catch (error) {
        await GlobalErrorHandler.handleError(
          error as Error,
          'ProcessImageJobService.processCancelledImages',
          { imageId },
        );
      }
    }

    if (summaryUpdates.length > 0) {
      await this.imageService.bulkUpdateImageSummary(summaryUpdates);
      console.log(
        `${summaryUpdates.length}개의 이미지 요약이 일괄 업데이트되었습니다.`,
      );
    }

    // 처리 완료된 이미지 ID 목록에서 제거
    await this.cache.removeProcessingImages(imageIds);
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
          'ProcessImageJobService.downloadBatchResults',
          { fileId, line },
        );
      }
    }

    return results;
  }

  private async processBatchResults(results: BatchJobOutput[]) {
    const summaryUpdates: ImageSummaryUpdate[] = [];
    const processedImageIds: number[] = [];

    for (const result of results) {
      try {
        console.log(result.response.body.choices[0].message);
        const functionCall =
          result.response.body.choices[0].message.function_call;
        if (functionCall && functionCall.name === 'analyze_image') {
          const summary = JSON.parse(
            functionCall.arguments,
          ) as ImageSummaryResponse;

          // custom_id에서 image ID 추출 (summary-image-{id} 형식)
          const id = Number(result.custom_id.replace('summary-image-', ''));
          processedImageIds.push(id);

          summaryUpdates.push({
            id,
            summary: summary.summary,
            qa: summary.qa,
          });
        }
      } catch (error) {
        await GlobalErrorHandler.handleError(
          error as Error,
          'ProcessImageJobService.processBatchResults',
          { customId: result.custom_id },
        );
      }
    }

    if (summaryUpdates.length > 0) {
      await this.imageService.bulkUpdateImageSummary(summaryUpdates);
      // 처리 완료된 이미지 ID 목록에서 제거
      await this.cache.removeProcessingImages(processedImageIds);
      console.log(
        `${summaryUpdates.length}개의 이미지 요약이 업데이트되었습니다.`,
      );
    }
  }
}
