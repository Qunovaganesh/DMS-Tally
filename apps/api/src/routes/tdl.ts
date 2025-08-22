import { Router } from 'express';
import { z } from 'zod';
import { SKU, SKUPrice } from '../models';
import { verifyHMAC } from '../middleware/hmac';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';
import { sequelize } from '../config/database';

const router = Router();

// Validation schemas
const skuIngestionSchema = z.object({
  manufacturerId: z.string().uuid(),
  skuCode: z.string(),
  name: z.string(),
  hsn: z.string().optional(),
  gstPercent: z.number().min(0).max(100),
  uom: z.string()
});

const priceIngestionSchema = z.object({
  manufacturerId: z.string().uuid(),
  skuCode: z.string(),
  price: z.number().positive(),
  currency: z.string().default('INR'),
  effectiveFrom: z.string().datetime()
});

const deltaIngestionSchema = z.object({
  manufacturerId: z.string().uuid(),
  changes: z.array(z.object({
    skuCode: z.string(),
    field: z.string(),
    oldValue: z.any(),
    newValue: z.any()
  }))
});

/**
 * @swagger
 * /api/tdl/ingest/sku:
 *   post:
 *     summary: Ingest SKU data from TDL
 *     tags: [TDL]
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
 *               skuCode:
 *                 type: string
 *               name:
 *                 type: string
 *               hsn:
 *                 type: string
 *               gstPercent:
 *                 type: number
 *               uom:
 *                 type: string
 *     responses:
 *       200:
 *         description: SKU ingested successfully
 */
router.post('/ingest/sku', verifyHMAC, validate(skuIngestionSchema), async (req, res, next) => {
  try {
    const { manufacturerId, skuCode, name, hsn, gstPercent, uom } = req.body;

    const [sku, created] = await SKU.findOrCreate({
      where: { manufacturerId, skuCode },
      defaults: {
        manufacturerId,
        skuCode,
        name,
        hsn,
        gstPercent,
        uom
      }
    });

    if (!created) {
      // Update existing SKU
      await sku.update({
        name,
        hsn,
        gstPercent,
        uom
      });
    }

    logger.info(`SKU ${skuCode} ${created ? 'created' : 'updated'} for manufacturer ${manufacturerId}`);

    res.json({
      success: true,
      data: {
        sku,
        created,
        message: `SKU ${created ? 'created' : 'updated'} successfully`
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/tdl/ingest/sku-price:
 *   post:
 *     summary: Ingest SKU price data from TDL
 *     tags: [TDL]
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
 *               skuCode:
 *                 type: string
 *               price:
 *                 type: number
 *               currency:
 *                 type: string
 *               effectiveFrom:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Price ingested successfully
 */
router.post('/ingest/sku-price', verifyHMAC, validate(priceIngestionSchema), async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { manufacturerId, skuCode, price, currency, effectiveFrom } = req.body;

    // Find the SKU
    const sku = await SKU.findOne({
      where: { manufacturerId, skuCode },
      transaction
    });

    if (!sku) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        error: `SKU ${skuCode} not found for manufacturer ${manufacturerId}`
      });
    }

    const effectiveDate = new Date(effectiveFrom);

    // Close previous price (set effectiveTo)
    await SKUPrice.update(
      { effectiveTo: effectiveDate },
      {
        where: {
          skuId: sku.id,
          effectiveTo: null,
          effectiveFrom: { [sequelize.Op.lt]: effectiveDate }
        },
        transaction
      }
    );

    // Create new price
    const newPrice = await SKUPrice.create({
      skuId: sku.id,
      price,
      currency,
      effectiveFrom: effectiveDate,
      effectiveTo: null
    }, { transaction });

    await transaction.commit();

    logger.info(`New price ${price} set for SKU ${skuCode} effective from ${effectiveFrom}`);

    res.json({
      success: true,
      data: {
        price: newPrice,
        message: 'Price updated successfully'
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

/**
 * @swagger
 * /api/tdl/ingest/delta:
 *   post:
 *     summary: Ingest delta changes from TDL
 *     tags: [TDL]
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
 *               changes:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     skuCode:
 *                       type: string
 *                     field:
 *                       type: string
 *                     oldValue:
 *                       type: string
 *                     newValue:
 *                       type: string
 *     responses:
 *       200:
 *         description: Delta changes processed
 */
router.post('/ingest/delta', verifyHMAC, validate(deltaIngestionSchema), async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { manufacturerId, changes } = req.body;

    const results = [];

    for (const change of changes) {
      const { skuCode, field, oldValue, newValue } = change;

      const sku = await SKU.findOne({
        where: { manufacturerId, skuCode },
        transaction
      });

      if (!sku) {
        results.push({
          skuCode,
          success: false,
          error: 'SKU not found'
        });
        continue;
      }

      // Apply the change based on field
      const updateData: any = {};
      updateData[field] = newValue;

      await sku.update(updateData, { transaction });

      results.push({
        skuCode,
        success: true,
        field,
        oldValue,
        newValue
      });

      logger.info(`Delta change applied to SKU ${skuCode}: ${field} changed from ${oldValue} to ${newValue}`);
    }

    await transaction.commit();

    res.json({
      success: true,
      data: {
        results,
        message: `Processed ${changes.length} delta changes`
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

export default router;