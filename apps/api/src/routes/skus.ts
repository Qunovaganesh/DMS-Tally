import { Router } from 'express';
import { Op } from 'sequelize';
import { SKU, SKUPrice, Manufacturer } from '../models';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/manufacturers:
 *   get:
 *     summary: Get all manufacturers
 *     tags: [SKUs]
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
 *         description: Manufacturers retrieved successfully
 */
router.get('/manufacturers', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const where: any = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: manufacturers } = await Manufacturer.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit: Number(limit),
      offset
    });

    res.json({
      success: true,
      data: manufacturers,
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
 * /api/manufacturers/{id}/skus:
 *   get:
 *     summary: Get SKUs for a manufacturer
 *     tags: [SKUs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
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
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SKUs retrieved successfully
 */
router.get('/manufacturers/:id/skus', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, q } = req.query;

    const where: any = { manufacturerId: id };
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { skuCode: { [Op.iLike]: `%${q}%` } }
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: skus } = await SKU.findAndCountAll({
      where,
      include: [
        {
          model: SKUPrice,
          as: 'prices',
          where: {
            effectiveFrom: { [Op.lte]: new Date() },
            [Op.or]: [
              { effectiveTo: null },
              { effectiveTo: { [Op.gte]: new Date() } }
            ]
          },
          required: false,
          order: [['effectiveFrom', 'DESC']],
          limit: 1
        }
      ],
      order: [['name', 'ASC']],
      limit: Number(limit),
      offset
    });

    // Add current price to each SKU
    const skusWithPrice = skus.map(sku => {
      const skuData = sku.toJSON();
      skuData.currentPrice = skuData.prices?.[0]?.price || null;
      delete skuData.prices;
      return skuData;
    });

    res.json({
      success: true,
      data: skusWithPrice,
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