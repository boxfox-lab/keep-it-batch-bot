import { KeepItAnalyzeNoteMainService } from './analyze-note-main.service';
import { NoteEntity, SiteEntity } from 'src/entity/keep-it';
import { Repository } from 'typeorm';
import { FolderUtilService } from './folder-util.service';
import { NoteJobCacheService } from './note-job-cache.service';
import { ProcessNoteJobService } from './process-note-job.service';
import { StartNoteJobService } from './start-note-job.service';
import { SiteUtilService } from '../site/site-util.service';

describe('KeepItAnalyzeNoteMainService', () => {
  let service: KeepItAnalyzeNoteMainService;
  let mockNoteRepo: jest.Mocked<Repository<NoteEntity>>;
  let mockSiteRepo: jest.Mocked<Repository<SiteEntity>>;
  let mockFolderService: jest.Mocked<FolderUtilService>;
  let mockSiteService: jest.Mocked<SiteUtilService>;
  let mockStartBatchJobService: jest.Mocked<StartNoteJobService>;
  let mockProcessNoteJobService: jest.Mocked<ProcessNoteJobService>;
  let mockCache: jest.Mocked<NoteJobCacheService>;
  let mockNoteQB: any;
  let mockSiteQB: any;

  beforeEach(() => {
    mockNoteQB = {
      where: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    mockNoteRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockNoteQB),
    } as any;

    mockSiteQB = {
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    mockSiteRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockSiteQB),
    } as any;

    mockFolderService = {
      getFolders: jest.fn().mockResolvedValue([]),
    } as any;
    mockSiteService = {
      fillOgDataToSites: jest.fn().mockResolvedValue(undefined),
    } as any;
    mockStartBatchJobService = {
      start: jest.fn().mockResolvedValue(undefined),
    } as any;
    mockProcessNoteJobService = {
      process: jest.fn().mockResolvedValue(undefined),
    } as any;
    mockCache = {
      getProcessingNotes: jest.fn().mockResolvedValue([]),
    } as any;

    service = new KeepItAnalyzeNoteMainService(
      mockNoteRepo,
      mockSiteRepo,
      mockFolderService,
      mockSiteService,
      mockStartBatchJobService,
      mockProcessNoteJobService,
      mockCache,
    );
  });

  describe('process', () => {
    it('should start processing notes that have all prerequisites', async () => {
      const mockUser = { id: 'user1' };
      const mockNote = {
        id: 1,
        ai_summary: null,
        user: mockUser,
        urls: ['http://site1.com'],
        images: [],
        lang: 'ko',
      } as any;
      const mockSite = {
        url: 'http://site1.com',
        title: 'Site 1',
        siteName: 'Site',
        description: 'Desc',
        html: '<html>',
        lang: 'ko',
      } as any;

      mockNoteQB.getMany.mockResolvedValue([mockNote]);
      mockSiteQB.getMany.mockResolvedValue([mockSite]);
      mockFolderService.getFolders.mockResolvedValue([
        { id: 'folder1' },
      ] as any);

      await service.process();

      expect(mockStartBatchJobService.start).toHaveBeenCalled();
    });

    it('should skip notes if images are not yet processed', async () => {
      const mockNote = {
        id: 1,
        ai_summary: null,
        user: { id: 'user1' },
        urls: [],
        images: [{ aiSummary: null }],
        lang: 'ko',
      } as any;

      mockNoteQB.getMany.mockResolvedValue([mockNote]);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await service.process();
      expect(consoleSpy).toHaveBeenCalledWith('처리할 노트가 없습니다.');
      expect(mockStartBatchJobService.start).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
