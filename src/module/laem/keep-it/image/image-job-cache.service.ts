import { CacheEntity } from 'src/entity/keep-it';
import { Like, Repository } from 'typeorm';

export class ImageJobCacheService {
  private readonly CACHE_CATEGORY = 'image-analysis';
  private readonly PROCESSING_IMAGES_KEY = `${this.CACHE_CATEGORY}-processing-images`;

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

  async getProcessingImages(): Promise<number[]> {
    const cache = await this.cache.findOne({
      where: { key: this.PROCESSING_IMAGES_KEY },
    });
    return cache ? JSON.parse(cache.value) : [];
  }

  async addProcessingImages(ids: number[]) {
    const currentImages = await this.getProcessingImages();
    const newImages = [...new Set([...currentImages, ...ids])];

    await this.cache.save({
      key: this.PROCESSING_IMAGES_KEY,
      value: JSON.stringify(newImages),
      time: new Date(),
    });
  }

  async removeProcessingImages(ids: number[]) {
    const currentImages = await this.getProcessingImages();
    const remainingImages = currentImages.filter((id) => !ids.includes(id));

    await this.cache.save({
      key: this.PROCESSING_IMAGES_KEY,
      value: JSON.stringify(remainingImages),
      time: new Date(),
    });
  }
}
