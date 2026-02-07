import { SiteEntity } from 'src/entity/keep-it';
import { IsNull, Repository } from 'typeorm';
import { ProcessSiteJobService } from './process-site-job.service';
import { SiteJobCacheService } from './site-job-cache.service';
import { StartSiteJobService } from './start-site-job.service';
import { GlobalErrorHandler } from 'src/util/error/global-error-handler';

export class KeepItAnalyzeSiteMainService {
  constructor(
    private readonly siteRepo: Repository<SiteEntity>,
    private readonly startBatchJobService: StartSiteJobService,
    private readonly processBatchJobService: ProcessSiteJobService,
    private readonly cache: SiteJobCacheService,
  ) {}

  async process() {
    try {
      // 1. 진행 중인 배치 작업 처리
      await this.processBatchJobService.process();

      // 2. 미처리 사이트 조회
      const sites = await this.fetchUnprocessedSites();

      // 3. 처리 중인 사이트 필터링
      const processingUrls = await this.cache.getProcessingUrls();
      const availableSites = sites.filter(
        (site) => !processingUrls.includes(site.id),
      );

      if (availableSites.length === 0) {
        console.log('처리할 새로운 사이트가 없습니다.');
        return;
      }

      // 4. 새로운 배치 작업 시작
      await this.startBatchJobService.start(availableSites);

      console.log(`${availableSites.length}개의 새로운 사이트 배치 작업 시작`);
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'KeepItAnalyzeSiteMainService.process',
      );
      throw error;
    }
  }

  private async fetchUnprocessedSites() {
    try {
      const sites = await this.siteRepo.find({
        where: {
          summary: IsNull(),
        },
      });
      return sites;
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'KeepItAnalyzeSiteMainService.fetchUnprocessedSites',
      );
      throw error;
    }
  }
}
