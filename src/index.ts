import { config, validateConfig } from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';
import { createBot } from './bot';
import { modelService } from './services';
import { setupQueueEvents, shutdownQueues } from './queues';
import { startWorkers } from './queues/workers';
import { createHealthServer } from './health/server';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();
    logger.info('Configuration validated');

    // Connect to database
    await connectDatabase();
    logger.info('Connected to database');

    // Seed default models
    await modelService.seedDefaultModels();
    logger.info('AI models seeded');

    // Connect to Redis
    try {
      await connectRedis();
      logger.info('Connected to Redis');
    } catch (error) {
      logger.warn('Redis connection failed, continuing without Redis:', error);
    }

    // Setup queue event listeners
    setupQueueEvents();

    // Start queue workers (in-process for single-instance mode)
    startWorkers();
    logger.info('Queue workers started');

    // Create and launch bot
    const bot = createBot();

    // Start health check / metrics server
    const healthApp = createHealthServer(config.health.port);

    if (config.bot.mode === 'webhook' && config.bot.webhookDomain) {
      // Webhook mode for multi-instance deployment
      const webhookPath = `/bot${config.bot.token}`;
      healthApp.use(bot.webhookCallback(webhookPath));
      await bot.telegram.setWebhook(`${config.bot.webhookDomain}${webhookPath}`);
      logger.info('Bot started in webhook mode');
    } else {
      // Long polling mode for development / single instance
      await bot.launch();
      logger.info('Bot started in polling mode');
    }

    logger.info(`Environment: ${config.app.nodeEnv}`);
    logger.info(`Health server: http://localhost:${config.health.port}/health`);

    // Enable graceful stop
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down...`);

      bot.stop(signal);
      await shutdownQueues();
      await disconnectRedis();
      await disconnectDatabase();

      logger.info('Shutdown complete');
      process.exit(0);
    };

    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

main();
