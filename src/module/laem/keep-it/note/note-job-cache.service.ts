import { Like, Repository } from 'typeorm';
import { CacheEntity } from 'src/entity/keep-it';

export class NoteJobCacheService {
  private readonly CACHE_CATEGORY = 'note-analysis';
  private readonly PROCESSING_NOTES_KEY = `${this.CACHE_CATEGORY}-processing-notes`;

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

  async getProcessingNotes(): Promise<number[]> {
    const cache = await this.cache.findOne({
      where: { key: this.PROCESSING_NOTES_KEY },
    });
    return cache ? JSON.parse(cache.value) : [];
  }

  async addProcessingNotes(noteIds: number[]) {
    const currentNotes = await this.getProcessingNotes();
    const newNotes = [...new Set([...currentNotes, ...noteIds])];

    await this.cache.save({
      key: this.PROCESSING_NOTES_KEY,
      value: JSON.stringify(newNotes),
      time: new Date(),
    });
  }

  async removeProcessingNotes(noteIds: number[]) {
    const currentNotes = await this.getProcessingNotes();
    const remainingNotes = currentNotes.filter((id) => !noteIds.includes(id));

    await this.cache.save({
      key: this.PROCESSING_NOTES_KEY,
      value: JSON.stringify(remainingNotes),
      time: new Date(),
    });
  }
}
