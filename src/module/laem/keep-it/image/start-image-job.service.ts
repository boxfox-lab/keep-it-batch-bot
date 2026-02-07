import fs from 'fs';
import OpenAI from 'openai';
import { ImageEntity } from 'src/entity/keep-it';
import { ImageJobCacheService } from './image-job-cache.service';
import { LANGUAGE_PROMPTS } from './language-prompts';
import { BatchJobResponse } from './image.dto';
import { GlobalErrorHandler } from 'src/util/error/global-error-handler';

export class StartImageJobService {
  constructor(
    private readonly openai: OpenAI,
    private readonly cache: ImageJobCacheService,
  ) {}

  async start(images: ImageEntity[]) {
    const batchFilePath = await this.makeBatchFile(images);
    const batchJob = await this.createAndRunBatchJob(batchFilePath);

    await this.cache.saveBatchJobCache(batchJob.id);
    await this.cache.addProcessingImages(images.map((image) => image.id));

    return batchJob;
  }

  private async makeBatchFile(images: ImageEntity[]) {
    const batchFilePath = 'image-batch.jsonl';
    const text = images
      .map((image) => JSON.stringify(this.makeRow(image)))
      .join('\n');
    fs.writeFileSync(batchFilePath, text, { encoding: 'utf8' });
    return batchFilePath;
  }

  private async createAndRunBatchJob(
    batchFilePath: string,
  ): Promise<BatchJobResponse> {
    try {
      // 1. 파일 업로드
      const file = await this.openai.files.create({
        file: fs.createReadStream(batchFilePath, { encoding: 'utf8' }),
        purpose: 'batch',
      });

      // 2. 배치 작업 생성 및 실행
      const batchJob = await this.openai.batches.create({
        input_file_id: file.id,
        endpoint: '/v1/chat/completions',
        completion_window: '24h',
      });

      console.log(`이미지 분석 배치 작업이 생성되었습니다. ID: ${batchJob.id}`);
      return batchJob;
    } catch (error) {
      await GlobalErrorHandler.handleError(
        error as Error,
        'StartImageJobService.createAndRunBatchJob',
        { batchFilePath },
      );
      throw error;
    }
  }

  public makeRow(image: ImageEntity): {
    custom_id: string;
    method: string;
    url: string;
    body: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;
  } {
    const lang = image.note?.lang || 'en';
    const prompts = LANGUAGE_PROMPTS[lang] || LANGUAGE_PROMPTS.en;

    const body: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming =
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: prompts.system,
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: image.url,
                },
              },
            ],
          },
        ],
        functions: [
          {
            name: 'analyze_image',
            description: prompts.function_description,
            parameters: {
              type: 'object',
              properties: {
                summary: {
                  type: 'string',
                  description: prompts.summary_desc,
                },
                qa: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      question: { type: 'string' },
                      answer: { type: 'string' },
                    },
                    required: ['question', 'answer'],
                  },
                  description: prompts.qa_desc,
                },
              },
              required: ['summary', 'qa'],
            },
          },
        ],
        function_call: { name: 'analyze_image' },
        max_tokens: 1000,
      };

    return {
      custom_id: `summary-image-${image.id}`,
      method: 'POST',
      url: '/v1/chat/completions',
      body,
    };
  }
}
