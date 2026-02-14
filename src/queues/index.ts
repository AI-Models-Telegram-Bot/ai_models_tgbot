import Queue from 'bull';
import { config } from '../config';
import { logger } from '../utils/logger';
import { GenerationJobData, GenerationJobResult } from './types';

export type { GenerationJobData, GenerationJobResult } from './types';

const redisUrl = config.redis.url;

export const textQueue = new Queue<GenerationJobData>('text-generation', redisUrl, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
    timeout: 120000, // 2 min
  },
});

export const imageQueue = new Queue<GenerationJobData>('image-generation', redisUrl, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 50,
    removeOnFail: 500,
    timeout: 300000, // 5 min (async polling for AIMLAPI/PiAPI image gen)
  },
});

export const videoQueue = new Queue<GenerationJobData>('video-generation', redisUrl, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 10000 },
    removeOnComplete: 20,
    removeOnFail: 200,
    timeout: 1200000, // 20 min
  },
});

export const audioQueue = new Queue<GenerationJobData>('audio-generation', redisUrl, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 50,
    removeOnFail: 500,
    timeout: 90000, // 1.5 min
  },
});

export const allQueues = { text: textQueue, image: imageQueue, video: videoQueue, audio: audioQueue };

export function getQueueByCategory(category: string): Queue.Queue<GenerationJobData> {
  switch (category) {
    case 'TEXT': return textQueue;
    case 'IMAGE': return imageQueue;
    case 'VIDEO': return videoQueue;
    case 'AUDIO': return audioQueue;
    default: return textQueue;
  }
}

/** Attach logging event listeners to all queues */
export function setupQueueEvents(): void {
  for (const [name, queue] of Object.entries(allQueues)) {
    queue.on('completed', (job) => {
      logger.info(`${name} job completed`, {
        jobId: job.id,
        processingTime: Date.now() - job.timestamp,
      });
    });

    queue.on('failed', (job, err) => {
      logger.error(`${name} job failed`, {
        jobId: job?.id,
        error: err.message,
        attempts: job?.attemptsMade,
      });
    });

    queue.on('stalled', (jobId) => {
      logger.warn(`${name} job stalled`, { jobId });
    });
  }
}

/** Get queue statistics for monitoring */
export async function getQueueStats(): Promise<Record<string, unknown>> {
  const stats: Record<string, unknown> = {};

  for (const [name, queue] of Object.entries(allQueues)) {
    stats[name] = {
      waiting: await queue.getWaitingCount(),
      active: await queue.getActiveCount(),
      completed: await queue.getCompletedCount(),
      failed: await queue.getFailedCount(),
      delayed: await queue.getDelayedCount(),
      paused: await queue.isPaused(),
    };
  }

  return stats;
}

/** Graceful shutdown of all queues */
export async function shutdownQueues(): Promise<void> {
  logger.info('Shutting down queues...');
  try {
    await Promise.all(
      Object.values(allQueues).map(queue => queue.close())
    );
    logger.info('All queues closed');
  } catch (error) {
    logger.error('Error closing queues', { error });
  }
}
