import { flatMap, fromPairs, uniq } from 'lodash';
import { NoteEntity, SiteEntity } from 'src/entity/keep-it';
import { Repository } from 'typeorm';
import { FolderUtilService } from './folder-util.service';
import { NoteJobCacheService } from './note-job-cache.service';
import { ProcessNoteJobService } from './process-note-job.service';
import { StartNoteJobService } from './start-note-job.service';
import { SiteUtilService } from '../site/site-util.service';
import { GlobalErrorHandler } from 'src/util/error/global-error-handler';

export class KeepItAnalyzeNoteMainService {
  constructor(
    private readonly noteRepo: Repository<NoteEntity>,
    private readonly siteRepo: Repository<SiteEntity>,
    private readonly folderService: FolderUtilService,
    private readonly siteService: SiteUtilService,
    private readonly startBatchJobService: StartNoteJobService,
    private readonly processBatchJobService: ProcessNoteJobService,
    private readonly cache: NoteJobCacheService,
  ) {}

  async process() {
    try {
      // 1. 먼저 진행 중인 배치 작업 처리
      await this.processBatchJobService.process();

      // 2. 요약이 없는 노트 조회
      const unprocessedNotes = await this.noteRepo
        .createQueryBuilder('note')
        .where('note.ai_summary IS NULL')
        .leftJoinAndSelect('note.user', 'user')
        .leftJoinAndSelect('note.folder', 'folder')
        .leftJoinAndSelect('note.images', 'images')
        .getMany();

      // 3. 현재 처리 중인 노트 ID 목록 조회
      const processingNoteIds = await this.cache.getProcessingNotes();

      // 4. 처리 중인 노트 제외
      let notesToProcess = unprocessedNotes.filter(
        (note) => !processingNoteIds.includes(note.id),
      );

      if (notesToProcess.length === 0) {
        console.log('처리할 노트가 없습니다.');
        return;
      }

      const folders = await this.folderService.getFolders(
        uniq(notesToProcess.map((note) => note.user.id)),
      );

      const siteMap = await this.getSites(notesToProcess);

      notesToProcess = notesToProcess.filter(
        (note) =>
          (!note.urls.length ||
            siteMap[note.id]?.length === note.urls.length) &&
          (!note.images.length ||
            note.images.every((i) => i.aiSummary != null)),
      );

      if (notesToProcess.length === 0) {
        console.log('처리할 노트가 없습니다.');
        return;
      }

      // 6. 배치 작업 시작
      await this.startBatchJobService.start(notesToProcess, folders, siteMap);

      console.log(
        `${notesToProcess.length}개의 노트에 대한 요약 작업이 시작되었습니다.`,
      );
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'KeepItAnalyzeNoteMainService.process',
      );
      throw error;
    }
  }

  private async getSites(notes: NoteEntity[]) {
    try {
      const urls = uniq(flatMap(notes.map((note) => note.urls)));
      if (!urls.length) {
        return {};
      }
      const sites = await this.siteRepo
        .createQueryBuilder('site')
        .where('site.url IN (:...urls)', {
          urls,
        })
        .getMany();

      // OG 데이터가 없는 사이트들을 자동으로 업데이트
      const sitesNeedingOGData = sites.filter(
        (site) =>
          !site.title || !site.siteName || !site.description || !site.html,
      );

      if (sitesNeedingOGData.length > 0) {
        console.log(
          `${sitesNeedingOGData.length}개의 사이트에서 OG 데이터를 가져오는 중...`,
        );
        await this.siteService.fillOgDataToSites(sitesNeedingOGData);

        // 업데이트된 사이트들을 다시 조회
        const updatedSites = await this.siteRepo
          .createQueryBuilder('site')
          .where('site.url IN (:...urls)', {
            urls,
          })
          .getMany();

        return fromPairs(
          notes
            .map((note) => [
              note.id,
              note.urls.map((url) =>
                updatedSites.find(
                  (site) => site.url === url && site.lang === note.lang,
                ),
              ),
            ])
            .filter(Boolean),
        );
      }

      return fromPairs(
        notes
          .map((note) => [
            note.id,
            note.urls.map((url) =>
              sites.find((site) => site.url === url && site.lang === note.lang),
            ),
          ])
          .filter(Boolean),
      );
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'KeepItAnalyzeNoteMainService.getSites',
      );
      throw error;
    }
  }
}
