import { Router } from 'express';
import { Op } from 'sequelize';
import { Order, InventoryBalance, Voucher, SKU, Distributor } from '../models';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/d/dashboard:
 *   get:
 *     summary: Get distributor dashboard data
 *     tags: [Distributor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved
 */
router.get('/dashboard', authenticate, authorize(['distributor']), async (req: AuthRequest, res, next) => {
  try {
    // Get distributor ID (simplified - in real app, get from user context)
    const distributor = await Distributor.findOne();
    if (!distributor) {
      return res.status(404).json({
        success: false,
        error: 'Distributor not found'
      });
    }

    // KPIs
    const onHandSkus = await InventoryBalance.count({
      where: {
        distributorId: distributor.id,
        onHand: { [Op.gt]: 0 }
      }
    });

    const lowStock = await InventoryBalance.count({
      where: {
        distributorId: distributor.id,
        onHand: { [Op.between]: [0, 10] } // Assuming low stock threshold is 10
      }
    });

    const openPos = await Order.count({
      where: {
        distributorId: distributor.id,
        status: { [Op.in]: ['placed', 'accepted'] }
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const recentSalesCount = await Voucher.count({
      where: {
        partyType: 'distributor',
        partyId: distributor.id,
        type: 'sales',
        createdAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    // Alerts
    const negativeStock = await InventoryBalance.findAll({
      where: {
        distributorId: distributor.id,
        onHand: { [Op.lt]: 0 }
      },
      include: [{ model: SKU, as: 'sku' }],
      limit: 10
    });

    const pendingReceipts = await Voucher.findAll({
      where: {
        partyType: 'distributor',
        partyId: distributor.id,
        type: 'receipt',
        status: 'queued'
      },
      limit: 10
    });

    // Recent vouchers
    const recentVouchers = await Voucher.findAll({
      where: {
        partyType: 'distributor',
        partyId: distributor.id
      },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    res.json({
      success: true,
      data: {
        kpis: {
          onHandSkus,
          lowStock,
          openPos,
          recentSales: recentSalesCount
        },
        alerts: {
          negativeStock,
          pendingReceipts
        },
        recentVouchers
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/d/inventory:
 *   get:
 *     summary: Get distributor inventory
 *     tags: [Distributor]
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
 *         description: Inventory retrieved successfully
 */
router.get('/inventory', authenticate, authorize(['distributor']), async (req: AuthRequest, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    // Get distributor ID (simplified)
    const distributor = await Distributor.findOne();
    if (!distributor) {
      return res.status(404).json({
        success: false,
        error: 'Distributor not found'
      });
    }

    const where: any = { distributorId: distributor.id };
    const skuWhere: any = {};

    if (search) {
      skuWhere[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { skuCode: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: inventory } = await InventoryBalance.findAndCountAll({
      where,
      include: [
        {
          model: SKU,
          as: 'sku',
          where: skuWhere,
          required: true
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      success: true,
      data: inventory,
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

export default router;