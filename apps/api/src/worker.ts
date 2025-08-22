import { logger } from './utils/logger';
import { sequelize } from './config/database';
import { 
  createVoucherExportWorker, 
  createCRMWorker, 
  scheduleRecurringJobs 
} from './services/queue';

async function startWorkers() {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established for workers');

    // Create workers
    const voucherWorker = createVoucherExportWorker();
    const crmWorker = createCRMWorker();

    // Schedule recurring jobs
    await scheduleRecurringJobs();

    logger.info('All workers started successfully');

    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down workers gracefully');
      await Promise.all([
        voucherWorker.close(),
        crmWorker.close()
      ]);
      await sequelize.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down workers gracefully');
      await Promise.all([
        voucherWorker.close(),
        crmWorker.close()
      ]);
      await sequelize.close();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start workers:', error);
    process.exit(1);
  }
}

startWorkers();