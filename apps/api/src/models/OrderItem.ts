import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class OrderItem extends Model {
  public id!: string;
  public orderId!: string;
  public skuId!: string;
  public qty!: number;
  public rate!: number;
  public gstPercent!: number;
  public lineTotal!: number;
  public lineGst!: number;
  public lineGrandTotal!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OrderItem.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'order_id',
    references: {
      model: 'orders',
      key: 'id'
    }
  },
  skuId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'sku_id',
    references: {
      model: 'skus',
      key: 'id'
    }
  },
  qty: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false
  },
  rate: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  gstPercent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'gst_percent'
  },
  lineTotal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'line_total'
  },
  lineGst: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'line_gst'
  },
  lineGrandTotal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'line_grand_total'
  }
}, {
  sequelize,
  modelName: 'OrderItem',
  tableName: 'order_items',
  indexes: [
    { fields: ['order_id'] },
    { fields: ['sku_id'] }
  ]
});