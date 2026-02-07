import { KeepItAnalyzeSiteMainService } from './analyze-site-main.service';
import { SiteEntity } from 'src/entity/keep-it';
import { Repository } from 'typeorm';
import { StartSiteJobService } from './start-site-job.service';
import { ProcessSiteJobService } from './process-site-job.service';
import { SiteJobCacheService } from './site-job-cache.service';
import { GlobalErrorHandler } from 'src/util/error/global-error-handler';

jest.mock('src/util/error/global-error-handler');

describe('KeepItAnalyzeSiteMainService', () => {
  let service: KeepItAnalyzeSiteMainService;
  let mockSiteRepo: jest.Mocked<Repository<SiteEntity>>;
  let mockStartBatchJobService: jest.Mocked<StartSiteJobService>;
  let mockProcessBatchJobService: jest.Mocked<ProcessSiteJobService>;
  let mockCache: jest.Mocked<SiteJobCacheService>;

  beforeEach(() => {
    mockSiteRepo = {
      find: jest.fn(),
    } as any;
    mockStartBatchJobService = {
      start: jest.fn(),
    } as any;
    mockProcessBatchJobService = {
      process: jest.fn(),
    } as any;
    mockCache = {
      getProcessingUrls: jest.fn(),
    } as any;

    service = new KeepItAnalyzeSiteMainService(
      mockSiteRepo,
      mockStartBatchJobService,
      mockProcessBatchJobService,
      mockCache,
    );
  });

  describe('process', () => {
    it('should process existing jobs and start new ones for unprocessed sites', async () => {
      const mockSites = [
        { id: 1, url: 'http://site1.com', summary: null },
        { id: 2, url: 'http://site2.com', summary: null },
      ] as any;

      mockProcessBatchJobService.process.mockResolvedValue(undefined);
      mockSiteRepo.find.mockResolvedValue(mockSites);
      mockCache.getProcessingUrls.mockResolvedValue([1]); // Site 1 is already being processed

      await service.process();

      expect(mockProcessBatchJobService.process).toHaveBeenCalled();
      expect(mockCache.getProcessingUrls).toHaveBeenCalled();
      expect(mockStartBatchJobService.start).toHaveBeenCalledWith([
        mockSites[1],
      ]); // Only Site 2 should start
    });

    it('should handle errors and call GlobalErrorHandler', async () => {
      const error = new Error('DB error');
      mockProcessBatchJobService.process.mockRejectedValue(error);

      await expect(service.process()).rejects.toThrow('DB error');
      expect(GlobalErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        'KeepItAnalyzeSiteMainService.process',
      );
    });

    it('should log if no new sites to process', async () => {
      mockProcessBatchJobService.process.mockResolvedValue(undefined);
      mockSiteRepo.find.mockResolvedValue([]);
      mockCache.getProcessingUrls.mockResolvedValue([]);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.process();

      expect(consoleSpy).toHaveBeenCalledWith(
        '처리할 새로운 사이트가 없습니다.',
      );
      expect(mockStartBatchJobService.start).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
