import bcrypt from 'bcrypt';
import { sequelize } from '../config/database';
import { 
  User, 
  Manufacturer, 
  Distributor, 
  ManufacturerDistributor,
  CRMContact,
  SKU,
  SKUPrice,
  Webhook
} from '../models';
import { logger } from '../utils/logger';

export async function seedDemoData() {
  const transaction = await sequelize.transaction();

  try {
    logger.info('Starting demo data seeding...');

    // Create admin user
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      role: 'admin',
      email: 'admin@bizzplus.com',
      phone: '+919876543210',
      passwordHash: adminPasswordHash,
      status: 'active'
    }, { transaction });

    // Create manufacturers
    const manufacturer1 = await Manufacturer.create({
      name: 'ABC Electronics Pvt Ltd',
      gstin: '27AABCA1234M1Z5',
      city: 'Mumbai'
    }, { transaction });

    const manufacturer2 = await Manufacturer.create({
      name: 'XYZ Components Ltd',
      gstin: '29AABCX5678N2Z6',
      city: 'Bangalore'
    }, { transaction });

    // Create distributors
    const distributor1 = await Distributor.create({
      name: 'Delhi Electronics Hub',
      gstin: '07AABCD9876P3Z7',
      city: 'Delhi'
    }, { transaction });

    const distributor2 = await Distributor.create({
      name: 'Chennai Tech Solutions',
      gstin: '33AABCE5432Q4Z8',
      city: 'Chennai'
    }, { transaction });

    // Create manufacturer-distributor relationships
    await ManufacturerDistributor.create({
      manufacturerId: manufacturer1.id,
      distributorId: distributor1.id,
      status: 'customer'
    }, { transaction });

    await ManufacturerDistributor.create({
      manufacturerId: manufacturer1.id,
      distributorId: distributor2.id,
      status: 'customer'
    }, { transaction });

    await ManufacturerDistributor.create({
      manufacturerId: manufacturer2.id,
      distributorId: distributor1.id,
      status: 'prospect'
    }, { transaction });

    // Create CRM contacts
    await CRMContact.create({
      entityType: 'manufacturer',
      entityId: manufacturer1.id,
      email: 'contact@abcelectronics.com',
      phone: '+919876543211',
      isPrimary: true
    }, { transaction });

    await CRMContact.create({
      entityType: 'manufacturer',
      entityId: manufacturer2.id,
      email: 'info@xyzcomponents.com',
      phone: '+919876543212',
      isPrimary: true
    }, { transaction });

    await CRMContact.create({
      entityType: 'distributor',
      entityId: distributor1.id,
      email: 'orders@delhielectronics.com',
      phone: '+919876543213',
      isPrimary: true
    }, { transaction });

    await CRMContact.create({
      entityType: 'distributor',
      entityId: distributor2.id,
      email: 'purchase@chennaitech.com',
      phone: '+919876543214',
      isPrimary: true
    }, { transaction });

    // Create manufacturer and distributor users
    const manufacturerPasswordHash = await bcrypt.hash('manufacturer123', 12);
    await User.create({
      role: 'manufacturer',
      email: 'contact@abcelectronics.com',
      phone: '+919876543211',
      passwordHash: manufacturerPasswordHash,
      status: 'active'
    }, { transaction });

    const distributorPasswordHash = await bcrypt.hash('distributor123', 12);
    await User.create({
      role: 'distributor',
      email: 'orders@delhielectronics.com',
      phone: '+919876543213',
      passwordHash: distributorPasswordHash,
      status: 'active'
    }, { transaction });

    // Create SKUs for manufacturer1
    const skus = [
      { code: 'LED-001', name: 'LED Strip Light 5M', hsn: '94054090', gst: 18, uom: 'PCS', price: 299.00 },
      { code: 'LED-002', name: 'LED Bulb 9W', hsn: '94054090', gst: 18, uom: 'PCS', price: 89.00 },
      { code: 'SW-001', name: 'Smart Switch 2-Way', hsn: '85365090', gst: 18, uom: 'PCS', price: 599.00 },
      { code: 'SW-002', name: 'Smart Switch 4-Way', hsn: '85365090', gst: 18, uom: 'PCS', price: 899.00 },
      { code: 'CAB-001', name: 'USB-C Cable 1M', hsn: '85444290', gst: 18, uom: 'PCS', price: 199.00 },
      { code: 'CAB-002', name: 'HDMI Cable 2M', hsn: '85444290', gst: 18, uom: 'PCS', price: 399.00 },
      { code: 'POW-001', name: 'Power Bank 10000mAh', hsn: '85076000', gst: 18, uom: 'PCS', price: 1299.00 },
      { code: 'POW-002', name: 'Wireless Charger', hsn: '85076000', gst: 18, uom: 'PCS', price: 799.00 },
      { code: 'SPK-001', name: 'Bluetooth Speaker', hsn: '85182200', gst: 18, uom: 'PCS', price: 1599.00 },
      { code: 'SPK-002', name: 'Wired Earphones', hsn: '85183000', gst: 18, uom: 'PCS', price: 299.00 }
    ];

    for (const skuData of skus) {
      const sku = await SKU.create({
        manufacturerId: manufacturer1.id,
        skuCode: skuData.code,
        name: skuData.name,
        hsn: skuData.hsn,
        gstPercent: skuData.gst,
        uom: skuData.uom
      }, { transaction });

      // Create current price
      await SKUPrice.create({
        skuId: sku.id,
        price: skuData.price,
        currency: 'INR',
        effectiveFrom: new Date(),
        effectiveTo: null
      }, { transaction });

      // Create a price history (older price)
      const olderDate = new Date();
      olderDate.setDate(olderDate.getDate() - 30);
      const olderPrice = skuData.price * 0.9; // 10% lower

      await SKUPrice.create({
        skuId: sku.id,
        price: olderPrice,
        currency: 'INR',
        effectiveFrom: olderDate,
        effectiveTo: new Date()
      }, { transaction });
    }

    // Create webhooks
    await Webhook.create({
      kind: 'tdl_ingest_sku',
      hmacSecret: 'tdl-sku-secret-key',
      isActive: true
    }, { transaction });

    await Webhook.create({
      kind: 'tdl_delta',
      hmacSecret: 'tdl-delta-secret-key',
      isActive: true
    }, { transaction });

    await Webhook.create({
      kind: 'distributor_ingest',
      hmacSecret: 'distributor-ingest-secret-key',
      isActive: true
    }, { transaction });

    await transaction.commit();
    logger.info('Demo data seeded successfully');

    // Log demo credentials
    logger.info('Demo login credentials:');
    logger.info('Admin: admin@bizzplus.com / admin123');
    logger.info('Manufacturer: contact@abcelectronics.com / manufacturer123');
    logger.info('Distributor: orders@delhielectronics.com / distributor123');

  } catch (error) {
    await transaction.rollback();
    logger.error('Failed to seed demo data:', error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDemoData()
    .then(() => {
      logger.info('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
}