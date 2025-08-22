import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/admin/overview:
 *   get:
 *     summary: Get admin overview
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Overview data retrieved
 */
router.get('/overview', async (req, res, next) => {
  try {
    // Mock data
    const mockData = {
      stats: {
        totalUsers: 25,
        activeUsers: 23,
        totalOrders: 156,
        pendingVouchers: 8,
        activeWebhooks: 3
      },
      recentActivity: {
        orders: [],
        vouchers: []
      }
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