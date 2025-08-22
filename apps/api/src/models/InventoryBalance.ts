import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class InventoryBalance extends Model {
  public id!: string;
  public distributorId!: string;
  public skuId!: string;
  public onHand!: number;
  public reserved!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InventoryBalance.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  skuId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'sku_id',
    references: {
      model: 'skus',
      key: 'id'
    }
  },
  onHand: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    defaultValue: 0,
    field: 'on_hand'
  },
  reserved: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    defaultValue: 0
  }
}, {
  sequelize,
  modelName: 'InventoryBalance',
  tableName: 'inventory_balances',
  indexes: [
    { 
      fields: ['distributor_id', 'sku_id'],
      unique: true
    },
    { fields: ['on_hand'] }
  ]
});