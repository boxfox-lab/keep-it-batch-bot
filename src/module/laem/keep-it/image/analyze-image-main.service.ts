import { ImageEntity } from 'src/entity/keep-it';
import { IsNull, Repository } from 'typeorm';
import { ProcessImageJobService } from './process-image-job.service';
import { ImageJobCacheService } from './image-job-cache.service';
import { StartImageJobService } from './start-image-job.service';
import { ImageUtilService } from './image-util.service';
import { GlobalErrorHandler } from 'src/util/error/global-error-handler';

export class AnalyzeImageMainService {
  constructor(
    private readonly imageService: ImageUtilService,
    private readonly cache: ImageJobCacheService,
    private readonly startBatchJobService: StartImageJobService,
    private readonly processBatchJobService: ProcessImageJobService,
  ) {}

  async process() {
    try {
      // 1. 진행 중인 배치 작업 처리
      await this.processBatchJobService.process();

      // 2. 미처리 이미지 조회
      const images = await this.fetchUnprocessedImages();

      // 3. 처리 중인 이미지 필터링
      const processingImageIds = await this.cache.getProcessingImages();
      const availableImages = images.filter(
        (image) => !processingImageIds.includes(image.id),
      );

      if (availableImages.length === 0) {
        console.log('처리할 새로운 이미지가 없습니다.');
        return;
      }

      // 4. 새로운 배치 작업 시작
      await this.startBatchJobService.start(availableImages);

      console.log(`${availableImages.length}개의 새로운 이미지 배치 작업 시작`);
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'AnalyzeImageMainService.process',
      );
      throw error;
    }
  }

  private async fetchUnprocessedImages() {
    try {
      const images = await this.imageService.getImagesWithoutSummary();
      return images;
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'AnalyzeImageMainService.fetchUnprocessedImages',
      );
      throw error;
    }
  }
}
