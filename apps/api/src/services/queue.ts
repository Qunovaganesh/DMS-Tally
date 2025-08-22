import { Queue, Worker } from 'bullmq';
import redis from '../config/redis';
import { logger } from '../utils/logger';
import { Voucher } from '../models';
import { watchNewCustomers } from './crm';

// Create queues
export const voucherExportQueue = new Queue('voucher-export', {
  connection: redis
});

export const crmQueue = new Queue('crm', {
  connection: redis
});

// Queue voucher for export
export async function queueVoucherExport(voucherId: string): Promise<void> {
  await voucherExportQueue.add('export-voucher', { voucherId }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });
}

// Queue CRM provisioning
export async function queueCRMProvisioning(): Promise<void> {
  await crmQueue.add('provision-logins', {}, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  });
}

// Voucher export worker
export function createVoucherExportWorker(): Worker {
  return new Worker('voucher-export', async (job) => {
    const { voucherId } = job.data;
    
    try {
      const voucher = await Voucher.findByPk(voucherId);
      if (!voucher) {
        throw new Error(`Voucher ${voucherId} not found`);
      }

      // Simulate export to Tally (replace with actual Tally API call)
      logger.info(`Exporting voucher ${voucherId} to Tally`, {
        type: voucher.type,
        partyType: voucher.partyType
      });

      // Mock API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update voucher status
      await voucher.update({
        status: 'sent',
        sentAt: new Date(),
        externalId: `TALLY-${Date.now()}`
      });

      logger.info(`Voucher ${voucherId} exported successfully`);

    } catch (error) {
      logger.error(`Failed to export voucher ${voucherId}:`, error);
      
      // Update voucher with error
      const voucher = await Voucher.findByPk(voucherId);
      if (voucher) {
        await voucher.update({
          status: 'error',
          errorMessage: error.message
        });
      }
      
      throw error;
    }
  }, {
    connection: redis,
    concurrency: 5
  });
}

// CRM worker
export function createCRMWorker(): Worker {
  return new Worker('crm', async (job) => {
    const { name } = job;
    
    try {
      if (name === 'provision-logins') {
        await watchNewCustomers();
      }
      
      logger.info(`CRM job ${name} completed successfully`);
      
    } catch (error) {
      logger.error(`CRM job ${name} failed:`, error);
      throw error;
    }
  }, {
    connection: redis,
    concurrency: 2
  });
}

// Schedule recurring jobs
export async function scheduleRecurringJobs(): Promise<void> {
  // Schedule CRM provisioning every 5 minutes
  await crmQueue.add('provision-logins', {}, {
    repeat: {
      pattern: '*/5 * * * *' // Every 5 minutes
    },
    jobId: 'crm-provisioning'
  });

  logger.info('Recurring jobs scheduled successfully');
}