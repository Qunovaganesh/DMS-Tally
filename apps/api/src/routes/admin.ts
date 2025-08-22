import { Router } from 'express';
import { User, Order, Voucher, Webhook } from '../models';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { triggerCRMProvisioning } from '../services/crm';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/admin/overview:
 *   get:
 *     summary: Get admin overview
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview data retrieved
 */
router.get('/overview', authenticate, authorize(['admin']), async (req: AuthRequest, res, next) => {
  try {
    // System stats
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: 'active' } });
    const totalOrders = await Order.count();
    const pendingVouchers = await Voucher.count({ where: { status: 'queued' } });
    const activeWebhooks = await Webhook.count({ where: { isActive: true } });

    // Recent activity
    const recentOrders = await Order.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const recentVouchers = await Voucher.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          totalOrders,
          pendingVouchers,
          activeWebhooks
        },
        recentActivity: {
          orders: recentOrders,
          vouchers: recentVouchers
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/users', authenticate, authorize(['admin']), async (req: AuthRequest, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['passwordHash'] },
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count,
        totalPages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/trigger-provisioning:
 *   post:
 *     summary: Trigger CRM provisioning
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Provisioning triggered
 */
router.post('/trigger-provisioning', authenticate, authorize(['admin']), async (req: AuthRequest, res, next) => {
  try {
    await triggerCRMProvisioning();

    logger.info(`CRM provisioning triggered by admin ${req.user!.email}`);

    res.json({
      success: true,
      message: 'CRM provisioning triggered successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/admin/webhooks:
 *   get:
 *     summary: Get all webhooks
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Webhooks retrieved successfully
 */
router.get('/webhooks', authenticate, authorize(['admin']), async (req: AuthRequest, res, next) => {
  try {
    const webhooks = await Webhook.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: webhooks
    });
  } catch (error) {
    next(error);
  }
});

export default router;