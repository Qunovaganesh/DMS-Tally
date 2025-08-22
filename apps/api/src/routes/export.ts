import { Router } from 'express';
import { Order, OrderItem, SKU, Manufacturer, Distributor, Voucher } from '../models';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { queueVoucherExport } from '../services/queue';

const router = Router();

/**
 * @swagger
 * /api/export/orders/{id}/vouchers:
 *   post:
 *     summary: Export order as vouchers to Tally
 *     tags: [Export]
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
 *         description: Vouchers queued for export
 */
router.post('/orders/:id/vouchers', authenticate, authorize(['manufacturer', 'admin']), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        { model: OrderItem, as: 'items', include: [{ model: SKU, as: 'sku' }] },
        { model: Manufacturer, as: 'manufacturer' },
        { model: Distributor, as: 'distributor' }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.status !== 'fulfilled') {
      return res.status(400).json({
        success: false,
        error: 'Only fulfilled orders can be exported'
      });
    }

    // Check if vouchers already exist
    const existingVouchers = await Voucher.findAll({
      where: {
        payloadJson: {
          orderNumber: order.number
        }
      }
    });

    if (existingVouchers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Vouchers already exist for this order'
      });
    }

    // Create sales voucher payload (for manufacturer)
    const salesVoucherPayload = {
      type: 'sales',
      orderNumber: order.number,
      date: order.fulfilledAt,
      party: {
        name: order.distributor!.name,
        gstin: order.distributor!.gstin
      },
      items: order.items!.map(item => ({
        name: item.sku!.name,
        hsn: item.sku!.hsn,
        qty: item.qty,
        uom: item.sku!.uom,
        rate: item.rate,
        amount: item.lineTotal,
        gstPercent: item.gstPercent,
        gstAmount: item.lineGst
      })),
      totals: {
        subtotal: order.subtotal,
        gstTotal: order.gstTotal,
        grandTotal: order.grandTotal
      }
    };

    // Create purchase voucher payload (for distributor)
    const purchaseVoucherPayload = {
      type: 'purchase',
      orderNumber: order.number,
      date: order.fulfilledAt,
      party: {
        name: order.manufacturer!.name,
        gstin: order.manufacturer!.gstin
      },
      items: order.items!.map(item => ({
        name: item.sku!.name,
        hsn: item.sku!.hsn,
        qty: item.qty,
        uom: item.sku!.uom,
        rate: item.rate,
        amount: item.lineTotal,
        gstPercent: item.gstPercent,
        gstAmount: item.lineGst
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
    });

    const purchaseVoucher = await Voucher.create({
      type: 'purchase',
      partyType: 'manufacturer',
      partyId: order.manufacturerId,
      source: 'system',
      payloadJson: purchaseVoucherPayload,
      status: 'queued'
    });

    // Queue for export
    await Promise.all([
      queueVoucherExport(salesVoucher.id),
      queueVoucherExport(purchaseVoucher.id)
    ]);

    logger.info(`Vouchers created and queued for export for order ${order.number}`);

    res.json({
      success: true,
      data: {
        salesVoucher: salesVoucher.id,
        purchaseVoucher: purchaseVoucher.id,
        message: 'Vouchers queued for export to Tally'
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;