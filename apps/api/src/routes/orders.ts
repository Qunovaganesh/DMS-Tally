import { Router } from 'express';
import { z } from 'zod';
import { Op } from 'sequelize';
import { Order, OrderItem, SKU, SKUPrice, Manufacturer, Distributor, InventoryBalance, Voucher } from '../models';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';
import { sequelize } from '../config/database';

const router = Router();

// Validation schemas
const createOrderSchema = z.object({
  manufacturerId: z.string().uuid(),
  items: z.array(z.object({
    skuId: z.string().uuid(),
    qty: z.number().positive()
  })).min(1)
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               manufacturerId:
 *                 type: string
 *                 format: uuid
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     skuId:
 *                       type: string
 *                       format: uuid
 *                     qty:
 *                       type: number
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post('/', authenticate, authorize(['distributor']), validate(createOrderSchema), async (req: AuthRequest, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { manufacturerId, items } = req.body;
    const userId = req.user!.id;

    // Get distributor ID from user (assuming user is linked to distributor)
    // In a real implementation, you'd have a proper user-distributor mapping
    const distributor = await Distributor.findOne(); // Simplified for demo
    if (!distributor) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        error: 'Distributor not found'
      });
    }

    // Generate order number
    const orderCount = await Order.count();
    const orderNumber = `ORD-${Date.now()}-${orderCount + 1}`;

    // Create order
    const order = await Order.create({
      number: orderNumber,
      manufacturerId,
      distributorId: distributor.id,
      status: 'draft',
      subtotal: 0,
      gstTotal: 0,
      grandTotal: 0,
      createdBy: userId
    }, { transaction });

    let subtotal = 0;
    let gstTotal = 0;

    // Create order items with calculations
    for (const item of items) {
      const sku = await SKU.findByPk(item.skuId, { transaction });
      if (!sku) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: `SKU ${item.skuId} not found`
        });
      }

      // Get current price
      const currentPrice = await SKUPrice.findOne({
        where: {
          skuId: item.skuId,
          effectiveFrom: { [Op.lte]: new Date() },
          [Op.or]: [
            { effectiveTo: null },
            { effectiveTo: { [Op.gte]: new Date() } }
          ]
        },
        order: [['effectiveFrom', 'DESC']],
        transaction
      });

      if (!currentPrice) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          error: `No current price found for SKU ${sku.name}`
        });
      }

      // Calculate line totals
      const lineTotal = item.qty * currentPrice.price;
      const lineGst = lineTotal * (sku.gstPercent / 100);
      const lineGrandTotal = lineTotal + lineGst;

      await OrderItem.create({
        orderId: order.id,
        skuId: item.skuId,
        qty: item.qty,
        rate: currentPrice.price,
        gstPercent: sku.gstPercent,
        lineTotal,
        lineGst,
        lineGrandTotal
      }, { transaction });

      subtotal += lineTotal;
      gstTotal += lineGst;
    }

    // Update order totals
    const grandTotal = subtotal + gstTotal;
    await order.update({
      subtotal,
      gstTotal,
      grandTotal
    }, { transaction });

    await transaction.commit();

    // Fetch complete order with items
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        { model: Manufacturer, as: 'manufacturer' },
        { model: Distributor, as: 'distributor' },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: SKU, as: 'sku' }]
        }
      ]
    });

    logger.info(`Order ${order.number} created by user ${userId}`);

    res.status(201).json({
      success: true,
      data: completeOrder
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
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
 *         description: Order retrieved successfully
 */
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        { model: Manufacturer, as: 'manufacturer' },
        { model: Distributor, as: 'distributor' },
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: SKU, as: 'sku' }]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

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
 * /api/orders/{id}/place:
 *   post:
 *     summary: Place an order
 *     tags: [Orders]
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
 *         description: Order placed successfully
 */
router.post('/:id/place', authenticate, authorize(['distributor']), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: 'Order cannot be placed'
      });
    }

    await order.update({
      status: 'placed',
      placedAt: new Date()
    });

    logger.info(`Order ${order.number} placed`);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
});

export default router;