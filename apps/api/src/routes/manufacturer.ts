import { Router } from 'express';
import { Op } from 'sequelize';
import { Order, OrderItem, SKU, Manufacturer, Distributor, Voucher, InventoryBalance } from '../models';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { sequelize } from '../config/database';
import { queueVoucherExport } from '../services/queue';

const router = Router();

/**
 * @swagger
 * /api/m/dashboard:
 *   get:
 *     summary: Get manufacturer dashboard data
 *     tags: [Manufacturer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved
 */
router.get('/dashboard', authenticate, authorize(['manufacturer']), async (req: AuthRequest, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get manufacturer ID (simplified - in real app, get from user context)
    const manufacturer = await Manufacturer.findOne();
    if (!manufacturer) {
      return res.status(404).json({
        success: false,
        error: 'Manufacturer not found'
      });
    }

    // KPIs
    const openOrders = await Order.count({
      where: {
        manufacturerId: manufacturer.id,
        status: 'placed'
      }
    });

    const todaysFulfillments = await Order.count({
      where: {
        manufacturerId: manufacturer.id,
        status: 'fulfilled',
        fulfilledAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    const todaysValueResult = await Order.sum('grandTotal', {
      where: {
        manufacturerId: manufacturer.id,
        status: 'fulfilled',
        fulfilledAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    const todaysValue = todaysValueResult || 0;

    // Latest orders
    const latestOrders = await Order.findAll({
      where: { manufacturerId: manufacturer.id },
      include: [
        { model: Distributor, as: 'distributor' }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Recent price changes (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const priceChanges = await sequelize.query(`
      SELECT sp.*, s.name as sku_name, s.sku_code
      FROM sku_prices sp
      JOIN skus s ON sp.sku_id = s.id
      WHERE s.manufacturer_id = :manufacturerId
        AND sp.effective_from >= :thirtyDaysAgo
      ORDER BY sp.effective_from DESC
      LIMIT 20
    `, {
      replacements: { 
        manufacturerId: manufacturer.id,
        thirtyDaysAgo
      },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        kpis: {
          openOrders,
          todaysFulfillments,
          todaysValue
        },
        latestOrders,
        priceChanges
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/m/orders:
 *   get:
 *     summary: Get manufacturer orders
 *     tags: [Manufacturer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/orders', authenticate, authorize(['manufacturer']), async (req: AuthRequest, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // Get manufacturer ID (simplified)
    const manufacturer = await Manufacturer.findOne();
    if (!manufacturer) {
      return res.status(404).json({
        success: false,
        error: 'Manufacturer not found'
      });
    }

    const where: any = { manufacturerId: manufacturer.id };
    if (status) {
      where.status = status;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        { model: Distributor, as: 'distributor' },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: SKU, as: 'sku' }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      success: true,
      data: orders,
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
 * /api/m/orders/{id}/accept:
 *   post:
 *     summary: Accept an order
 *     tags: [Manufacturer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order accepted successfully
 */
router.post('/orders/:id/accept', authenticate, authorize(['manufacturer']), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.status !== 'placed') {
      return res.status(400).json({
        success: false,
        error: 'Order cannot be accepted'
      });
    }

    await order.update({ status: 'accepted' });

    logger.info(`Order ${order.number} accepted by manufacturer`);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/m/orders/{id}/reject:
 *   post:
 *     summary: Reject an order
 *     tags: [Manufacturer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order rejected successfully
 */
router.post('/orders/:id/reject', authenticate, authorize(['manufacturer']), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.status !== 'placed') {
      return res.status(400).json({
        success: false,
        error: 'Order cannot be rejected'
      });
    }

    await order.update({ status: 'rejected' });

    logger.info(`Order ${order.number} rejected by manufacturer`);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/m/orders/{id}/fulfill:
 *   post:
 *     summary: Fulfill an order
 *     tags: [Manufacturer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order fulfilled successfully
 */
router.post('/orders/:id/fulfill', authenticate, authorize(['manufacturer']), async (req: AuthRequest, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        { model: OrderItem, as: 'items', include: [{ model: SKU, as: 'sku' }] },
        { model: Manufacturer, as: 'manufacturer' },
        { model: Distributor, as: 'distributor' }
      ],
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.status !== 'accepted') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Order cannot be fulfilled'
      });
    }

    // Update order status
    await order.update({
      status: 'fulfilled',
      fulfilledAt: new Date()
    }, { transaction });

    // Update distributor inventory
    for (const item of order.items!) {
      const [inventoryBalance] = await InventoryBalance.findOrCreate({
        where: {
          distributorId: order.distributorId,
          skuId: item.skuId
        },
        defaults: {
          distributorId: order.distributorId,
          skuId: item.skuId,
          onHand: 0,
          reserved: 0
        },
        transaction
      });

      await inventoryBalance.update({
        onHand: inventoryBalance.onHand + item.qty
      }, { transaction });
    }

    // Create vouchers for export to Tally
    const salesVoucherPayload = {
      type: 'sales',
      orderNumber: order.number,
      party: {
        name: order.distributor!.name,
        gstin: order.distributor!.gstin
      },
      items: order.items!.map(item => ({
        name: item.sku!.name,
        qty: item.qty,
        rate: item.rate,
        amount: item.lineTotal,
        gst: item.lineGst
      })),
      totals: {
        subtotal: order.subtotal,
        gstTotal: order.gstTotal,
        grandTotal: order.grandTotal
      }
    };

    const purchaseVoucherPayload = {
      type: 'purchase',
      orderNumber: order.number,
      party: {
        name: order.manufacturer!.name,
        gstin: order.manufacturer!.gstin
      },
      items: order.items!.map(item => ({
        name: item.sku!.name,
        qty: item.qty,
        rate: item.rate,
        amount: item.lineTotal,
        gst: item.lineGst
      })),
      totals: {
        subtotal: order.subtotal,
        gstTotal: order.gstTotal,
        grandTotal: order.grandTotal
      }
    };

    // Create voucher records
    const salesVoucher = await Voucher.create({
      type: 'sales',
      partyType: 'distributor',
      partyId: order.distributorId,
      source: 'system',
      payloadJson: salesVoucherPayload,
      status: 'queued'
    }, { transaction });

    const purchaseVoucher = await Voucher.create({
      type: 'purchase',
      partyType: 'manufacturer',
      partyId: order.manufacturerId,
      source: 'system',
      payloadJson: purchaseVoucherPayload,
      status: 'queued'
    }, { transaction });

    await transaction.commit();

    // Queue voucher exports
    await queueVoucherExport(salesVoucher.id);
    await queueVoucherExport(purchaseVoucher.id);

    logger.info(`Order ${order.number} fulfilled and vouchers queued for export`);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

export default router;