import OpenAI from 'openai';
import { Connection } from 'typeorm';
import {
  CacheEntity,
  FCMTokenEntity,
  FolderEntity,
  FolderHistoryEntity,
  ImageEntity,
  NoteEntity,
  NoteHistoryEntity,
  NotifyEntity,
  NotifyPermissionEntity,
  SiteEntity,
} from './entity/keep-it';
import {
  AnalyzeImageMainService,
  ImageJobCacheService,
  ImageUtilService,
  ProcessImageJobService,
  StartImageJobService as StartImageBatchJobService,
} from './module/laem/keep-it/image';
import {
  FolderUtilService,
  KeepItAnalyzeNoteMainService,
  NoteJobCacheService,
  ProcessNoteJobService,
  StartNoteJobService,
} from './module/laem/keep-it/note';
import { NotifyService } from './module/laem/keep-it/notify';
import {
  KeepItAnalyzeSiteMainService,
  ProcessSiteJobService,
  SiteJobCacheService,
  StartSiteJobService,
} from './module/laem/keep-it/site';
import { SiteUtilService } from './module/laem/keep-it/site/site-util.service';
import { startJob } from './util/startJob';

export function createKeepItBatchBot(connection: Connection) {
  const cacheRepo = connection.getRepository(CacheEntity);
  const noteRepo = connection.getRepository(NoteEntity);
  const siteRepo = connection.getRepository(SiteEntity);
  const folderRepo = connection.getRepository(FolderEntity);
  const imageRepo = connection.getRepository(ImageEntity);
  const notifyRepo = connection.getRepository(NotifyEntity);
  const tokenRepo = connection.getRepository(FCMTokenEntity);
  const permissionRepo = connection.getRepository(NotifyPermissionEntity);
  const noteHistoryRepo = connection.getRepository(NoteHistoryEntity);
  const folderHistoryRepo = connection.getRepository(FolderHistoryEntity);

  // Notify 관련 서비스
  const notifyService = new NotifyService(
    notifyRepo,
    tokenRepo,
    permissionRepo,
  );

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Site 관련 서비스
  const cacheService = new SiteJobCacheService(cacheRepo);
  const siteService = new SiteUtilService(siteRepo);
  const startSiteBatchJobService = new StartSiteJobService(
    openai,
    cacheService,
  );
  const processBatchJobService = new ProcessSiteJobService(
    openai,
    cacheService,
    siteService,
    startSiteBatchJobService,
  );
  const keepItSiteService = new KeepItAnalyzeSiteMainService(
    siteRepo,
    startSiteBatchJobService,
    processBatchJobService,
    cacheService,
  );

  // Note 관련 서비스
  const folderService = new FolderUtilService(folderRepo, folderHistoryRepo);
  const noteCacheService = new NoteJobCacheService(cacheRepo);
  const startNoteBatchJobService = new StartNoteJobService(
    openai,
    noteCacheService,
  );
  const processNoteBatchJobService = new ProcessNoteJobService(
    openai,
    noteRepo,
    noteHistoryRepo,
    folderService,
    noteCacheService,
    notifyService,
    startNoteBatchJobService,
  );
  const noteService = new KeepItAnalyzeNoteMainService(
    noteRepo,
    siteRepo,
    folderService,
    siteService,
    startNoteBatchJobService,
    processNoteBatchJobService,
    noteCacheService,
  );

  // Image 관련 서비스
  const imageCacheService = new ImageJobCacheService(cacheRepo);
  const startImageBatchJobService = new StartImageBatchJobService(
    openai,
    imageCacheService,
  );
  const imageService = new ImageUtilService(imageRepo);
  const processImageBatchJobService = new ProcessImageJobService(
    openai,
    imageCacheService,
    imageService,
    startImageBatchJobService,
  );
  const imageSummaryService = new AnalyzeImageMainService(
    imageService,
    imageCacheService,
    startImageBatchJobService,
    processImageBatchJobService,
  );

  return async function start() {
    await Promise.all([
      startJob(
        'keep-it site batch bot',
        () => keepItSiteService.process(),
        5000,
      ),
      startJob('keep-it note batch bot', () => noteService.process(), 5000),
      startJob(
        'keep-it image batch bot',
        () => imageSummaryService.process(),
        5000,
      ),
    ]);
  };
}
