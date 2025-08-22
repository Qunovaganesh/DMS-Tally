import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class SKUPrice extends Model {
  public id!: string;
  public skuId!: string;
  public price!: number;
  public currency!: string;
  public effectiveFrom!: Date;
  public effectiveTo!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SKUPrice.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'INR'
  },
  effectiveFrom: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'effective_from'
  },
  effectiveTo: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'effective_to'
  }
}, {
  sequelize,
  modelName: 'SKUPrice',
  tableName: 'sku_prices',
  indexes: [
    { fields: ['sku_id'] },
    { fields: ['effective_from'] },
    { fields: ['effective_to'] }
  ]
});