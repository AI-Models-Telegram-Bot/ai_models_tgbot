import { validateConfig } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { setupQueueEvents, shutdownQueues } from './queues';
import { startWorkers } from './queues/workers';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  try {
    // Use console.log for startup messages — winston's Console transport
    // doesn't flush reliably to Docker's log driver when running as PID 1
    console.log('[worker] Starting up...');

    validateConfig();
    logger.info('Worker: configuration validated');

    await connectDatabase();
    logger.info('Worker: connected to database');

    await connectRedis();
    logger.info('Worker: connected to Redis');

    setupQueueEvents();
    startWorkers();

    console.log('[worker] All queue workers started — ready to process jobs');
    logger.info('Worker process is running');

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down worker...`);

      await shutdownQueues();
      await disconnectRedis();
      await disconnectDatabase();

      logger.info('Worker shutdown complete');
      process.exit(0);
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('[worker] FATAL: Failed to start:', error);
    logger.error('Worker failed to start:', error);
    process.exit(1);
  }
}

main();
