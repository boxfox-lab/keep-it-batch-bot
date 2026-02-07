import { Like, Repository } from 'typeorm';
import { CacheEntity } from 'src/entity/keep-it';

export class SiteJobCacheService {
  private readonly CACHE_CATEGORY = 'site-analysis';
  private readonly PROCESSING_URLS_KEY = `${this.CACHE_CATEGORY}-processing-urls`;

  constructor(private readonly cache: Repository<CacheEntity>) {}

  async getBatchJobCache() {
    return await this.cache.find({
      where: {
        key: Like(`${this.CACHE_CATEGORY}-batch-job-%`),
      },
    });
  }

  async saveBatchJobCache(jobId: string) {
    await this.cache.save({
      key: `${this.CACHE_CATEGORY}-batch-job-${jobId}`,
      value: jobId,
      time: new Date(),
    });
  }

  async deleteBatchJobCache(jobId: string) {
    await this.cache.delete({
      key: `${this.CACHE_CATEGORY}-batch-job-${jobId}`,
    });
  }

  async getProcessingUrls(): Promise<number[]> {
    const cache = await this.cache.findOne({
      where: { key: this.PROCESSING_URLS_KEY },
    });
    return cache ? JSON.parse(cache.value) : [];
  }

  async addProcessingSites(ids: number[]) {
    const currentUrls = await this.getProcessingUrls();
    const newUrls = [...new Set([...currentUrls, ...ids])];

    await this.cache.save({
      key: this.PROCESSING_URLS_KEY,
      value: JSON.stringify(newUrls),
      time: new Date(),
    });
  }

  async removeProcessingSites(ids: number[]) {
    const currentUrls = await this.getProcessingUrls();
    const remainingUrls = currentUrls.filter((id) => !ids.includes(id));

    await this.cache.save({
      key: this.PROCESSING_URLS_KEY,
      value: JSON.stringify(remainingUrls),
      time: new Date(),
    });
  }
}
