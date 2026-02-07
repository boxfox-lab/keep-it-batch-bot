import { Repository } from 'typeorm';
import { SiteEntity } from 'src/entity/keep-it';
import { OGFetchService } from './og-fetch.service';
import { GlobalErrorHandler } from 'src/util/error/global-error-handler';

interface SiteSummaryUpdate {
  id: number;
  summary: string;
  qa: { question: string; answer: string }[];
}

export class SiteUtilService {
  private readonly ogFetchService: OGFetchService;

  constructor(private readonly siteRepo: Repository<SiteEntity>) {
    this.ogFetchService = new OGFetchService();
  }

  async getSiteById(id: number): Promise<SiteEntity | null> {
    try {
      return await this.siteRepo.findOne({ where: { id } });
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'SiteUtilService.getSiteById',
        { id },
      );
      throw error;
    }
  }

  async bulkUpdateSiteSummary(updates: SiteSummaryUpdate[]) {
    try {
      for (const update of updates) {
        await this.siteRepo.update(
          { id: update.id },
          {
            summary: update.summary,
            qa: update.qa,
          },
        );
      }
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'SiteUtilService.bulkUpdateSiteSummary',
        { updates },
      );
      throw error;
    }
  }

  async fillOgDataToSites(sites: SiteEntity[]): Promise<SiteEntity[]> {
    try {
      const sitesNeedingOGData = sites.filter(
        (site) =>
          !site.title || !site.siteName || !site.description || !site.html,
      );

      if (sitesNeedingOGData.length === 0) {
        return sites;
      }

      const data: SiteEntity[] = [];
      const updatedSites: SiteEntity[] = [];
      for (const site of sites) {
        const res = await this.fillOgData(site);
        data.push(site);
        if (res.isUpdated) {
          updatedSites.push(res.site);
        }
      }
      if (updatedSites.length > 0) {
        await this.siteRepo.save(updatedSites);
      }

      return data;
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'SiteUtilService.fillOgDataToSites',
        { sitesCount: sites.length },
      );
      throw error;
    }
  }

  private async fillOgData(site: SiteEntity) {
    try {
      if (site.title && site.siteName && site.description && site.html) {
        return { site, isUpdated: false };
      }

      const ogData = await this.ogFetchService.fetchOGData(site.url);
      if (!ogData) {
        return { site, isUpdated: false };
      }

      site.title = ogData.title || site.title;
      site.siteName = ogData.siteName || site.siteName;
      site.description = ogData.description || site.description;
      site.html = ogData.html || site.html;
      site.thumbnail = ogData.image || site.thumbnail;

      return { site, isUpdated: true };
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'SiteUtilService.fillOgData',
        { siteId: site.id, url: site.url },
      );
      return { site, isUpdated: false };
    }
  }
}
