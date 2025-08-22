import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/m/dashboard:
 *   get:
 *     summary: Get manufacturer dashboard data
 *     tags: [Manufacturer]
 *     responses:
 *       200:
 *         description: Dashboard data retrieved
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    // Mock data
    const mockData = {
      kpis: {
        openOrders: 12,
        todaysFulfillments: 8,
        todaysValue: 125000
      },
      latestOrders: [
        {
          id: '1',
          number: 'ORD-001',
          distributor: 'Delhi Electronics Hub',
          total: 15000,
          status: 'placed',
          createdAt: new Date().toISOString()
        }
      ],
      priceChanges: []
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