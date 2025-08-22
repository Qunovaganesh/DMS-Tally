import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/d/dashboard:
 *   get:
 *     summary: Get distributor dashboard data
 *     tags: [Distributor]
 *     responses:
 *       200:
 *         description: Dashboard data retrieved
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    // Mock data
    const mockData = {
      kpis: {
        onHandSkus: 245,
        lowStock: 12,
        openPos: 5,
        recentSales: 18
      },
      alerts: {
        negativeStock: [],
        pendingReceipts: []
      },
      recentVouchers: []
    };

    res.json({
      success: true,
      data: mockData
    });
  } catch (error) {
    next(error);
  }
});

export default router;