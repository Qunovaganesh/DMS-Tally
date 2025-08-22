import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { OrderStatus } from '@bizzplus/types';

export class Order extends Model {
  public id!: string;
  public number!: string;
  public manufacturerId!: string;
  public distributorId!: string;
  public status!: OrderStatus;
  public subtotal!: number;
  public gstTotal!: number;
  public grandTotal!: number;
  public placedAt!: Date | null;
  public fulfilledAt!: Date | null;
  public createdBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Order.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  manufacturerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'manufacturer_id',
    references: {
      model: 'manufacturers',
      key: 'id'
    }
  },
  distributorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'distributor_id',
    references: {
      model: 'distributors',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'placed', 'accepted', 'rejected', 'fulfilled'),
    allowNull: false,
    defaultValue: 'draft'
  },
  subtotal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  gstTotal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'gst_total'
  },
  grandTotal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'grand_total'
  },
  placedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'placed_at'
  },
  fulfilledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'fulfilled_at'
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'Order',
  tableName: 'orders',
  indexes: [
    { fields: ['number'] },
    { fields: ['manufacturer_id'] },
    { fields: ['distributor_id'] },
    { fields: ['status'] },
    { fields: ['placed_at'] },
    { fields: ['fulfilled_at'] }
  ]
});