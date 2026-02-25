import { Job } from 'bull';
import { getQueueByCategory, GenerationJobData } from './index';
import { logger } from '../utils/logger';

/** Max concurrent jobs per user per queue category */
const MAX_USER_JOBS = 5;

/**
 * Enqueue a generation job. Returns immediately - worker will process async.
 * Enforces per-user limits to prevent a single user from flooding queues.
 */
export async function enqueueGeneration(data: GenerationJobData): Promise<Job<GenerationJobData>> {
  const queue = getQueueByCategory(data.modelCategory);

  // Per-user rate limit: count active + waiting jobs for this user in this queue
  const [waiting, active] = await Promise.all([
    queue.getWaiting(),
    queue.getActive(),
  ]);

  const userJobCount = [...waiting, ...active].filter(
    (j) => j.data.userId === data.userId
  ).length;

  if (userJobCount >= MAX_USER_JOBS) {
    logger.warn('Per-user job limit reached', {
      userId: data.userId,
      category: data.modelCategory,
      activeJobs: userJobCount,
      limit: MAX_USER_JOBS,
    });
    throw new Error(
      `Too many pending requests (${userJobCount}/${MAX_USER_JOBS}). Please wait for current ones to finish.`
    );
  }

  // Deep research needs longer timeout (up to 10 search iterations)
  const isDeepResearch = data.modelSlug === 'deep-research';
  const jobOpts: Record<string, unknown> = {
    // Text gets highest priority (fastest to process)
    priority: data.modelCategory === 'TEXT' ? 1 : data.modelCategory === 'VIDEO' ? 10 : 5,
  };
  if (isDeepResearch) {
    jobOpts.timeout = 600000; // 10 min for deep research
  }

  return queue.add(data, jobOpts);
}
