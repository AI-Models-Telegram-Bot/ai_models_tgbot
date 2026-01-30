import { Job } from 'bull';
import { getQueueByCategory, GenerationJobData } from './index';

/**
 * Enqueue a generation job. Returns immediately - worker will process async.
 */
export async function enqueueGeneration(data: GenerationJobData): Promise<Job<GenerationJobData>> {
  const queue = getQueueByCategory(data.modelCategory);

  return queue.add(data, {
    // Text gets highest priority (fastest to process)
    priority: data.modelCategory === 'TEXT' ? 1 : data.modelCategory === 'VIDEO' ? 10 : 5,
  });
}
