// Import all models
import { User } from './User';
import { Manufacturer } from './Manufacturer';
import { Distributor } from './Distributor';
import { ManufacturerDistributor } from './ManufacturerDistributor';
import { CRMContact } from './CRMContact';
import { Session } from './Session';
import { SKU } from './SKU';
import { SKUPrice } from './SKUPrice';
import { Order } from './Order';
import { OrderItem } from './OrderItem';
import { InventoryBalance } from './InventoryBalance';
import { Voucher } from './Voucher';
import { AuditLog } from './AuditLog';

// User associations
User.hasMany(Session, { foreignKey: 'userId', as: 'sessions' });
Session.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Order, { foreignKey: 'createdBy', as: 'createdOrders' });
Order.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(AuditLog, { foreignKey: 'actorUserId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'actorUserId', as: 'actor' });

// Manufacturer associations
Manufacturer.hasMany(ManufacturerDistributor, { foreignKey: 'manufacturerId', as: 'distributorRelationships' });
ManufacturerDistributor.belongsTo(Manufacturer, { foreignKey: 'manufacturerId', as: 'manufacturer' });

Manufacturer.hasMany(SKU, { foreignKey: 'manufacturerId', as: 'skus' });
SKU.belongsTo(Manufacturer, { foreignKey: 'manufacturerId', as: 'manufacturer' });

Manufacturer.hasMany(Order, { foreignKey: 'manufacturerId', as: 'orders' });
Order.belongsTo(Manufacturer, { foreignKey: 'manufacturerId', as: 'manufacturer' });

// Distributor associations
Distributor.hasMany(ManufacturerDistributor, { foreignKey: 'distributorId', as: 'manufacturerRelationships' });
ManufacturerDistributor.belongsTo(Distributor, { foreignKey: 'distributorId', as: 'distributor' });

Distributor.hasMany(Order, { foreignKey: 'distributorId', as: 'orders' });
Order.belongsTo(Distributor, { foreignKey: 'distributorId', as: 'distributor' });

Distributor.hasMany(InventoryBalance, { foreignKey: 'distributorId', as: 'inventoryBalances' });
InventoryBalance.belongsTo(Distributor, { foreignKey: 'distributorId', as: 'distributor' });

// SKU associations
SKU.hasMany(SKUPrice, { foreignKey: 'skuId', as: 'prices' });
SKUPrice.belongsTo(SKU, { foreignKey: 'skuId', as: 'sku' });

SKU.hasMany(OrderItem, { foreignKey: 'skuId', as: 'orderItems' });
OrderItem.belongsTo(SKU, { foreignKey: 'skuId', as: 'sku' });

SKU.hasMany(InventoryBalance, { foreignKey: 'skuId', as: 'inventoryBalances' });
InventoryBalance.belongsTo(SKU, { foreignKey: 'skuId', as: 'sku' });

// Order associations
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

// CRM Contact associations (polymorphic)
CRMContact.belongsTo(Manufacturer, { 
  foreignKey: 'entityId', 
  constraints: false,
  scope: { entityType: 'manufacturer' },
  as: 'manufacturerEntity'
});

CRMContact.belongsTo(Distributor, { 
  foreignKey: 'entityId', 
  constraints: false,
  scope: { entityType: 'distributor' },
  as: 'distributorEntity'
});

Manufacturer.hasMany(CRMContact, {
  foreignKey: 'entityId',
  constraints: false,
  scope: { entityType: 'manufacturer' },
  as: 'crmContacts'
});

Distributor.hasMany(CRMContact, {
  foreignKey: 'entityId',
  constraints: false,
  scope: { entityType: 'distributor' },
  as: 'crmContacts'
});