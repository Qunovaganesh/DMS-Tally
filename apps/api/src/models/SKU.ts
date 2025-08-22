import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class SKU extends Model {
  public id!: string;
  public manufacturerId!: string;
  public skuCode!: string;
  public name!: string;
  public hsn!: string | null;
  public gstPercent!: number;
  public uom!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SKU.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  skuCode: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'sku_code'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  hsn: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gstPercent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'gst_percent'
  },
  uom: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'SKU',
  tableName: 'skus',
  indexes: [
    { 
      fields: ['manufacturer_id', 'sku_code'],
      unique: true
    },
    { fields: ['name'] },
    { fields: ['hsn'] }
  ]
});