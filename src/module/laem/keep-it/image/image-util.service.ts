import { ImageEntity } from 'src/entity/keep-it';
import { IsNull, Repository, In } from 'typeorm';

export class ImageUtilService {
  constructor(private readonly imageRepo: Repository<ImageEntity>) {}

  async getImagesWithoutSummary() {
    return this.imageRepo.find({
      where: {
        aiSummary: IsNull(),
      },
      relations: ['note'],
    });
  }

  async getImageById(id: number) {
    return this.imageRepo.findOne({
      where: { id },
      relations: ['note'],
    });
  }

  async updateImageSummary(
    imageId: number,
    summary: string,
    qa: { question: string; answer: string }[],
  ) {
    await this.imageRepo.update(imageId, {
      aiSummary: summary,
      qa,
    });
  }

  async bulkUpdateImageSummary(
    updates: {
      id: number;
      summary: string;
      qa: { question: string; answer: string }[];
    }[],
  ) {
    if (updates.length === 0) return;

    const images = await this.imageRepo.find({
      where: {
        id: In(updates.map((u) => u.id)),
      },
    });

    const updatedImages = images.map((image) => {
      const update = updates.find((u) => u.id === image.id);
      if (update) {
        image.aiSummary = update.summary;
        image.qa = update.qa;
      }
      return image;
    });

    if (updatedImages.length > 0) {
      await this.imageRepo.save(updatedImages);
    }
  }
}
