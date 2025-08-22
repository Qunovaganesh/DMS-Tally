import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Manufacturer extends Model {
  public id!: string;
  public name!: string;
  public gstin!: string | null;
  public city!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Manufacturer.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gstin: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Manufacturer',
  tableName: 'manufacturers',
  indexes: [
    { fields: ['name'] },
    { fields: ['gstin'] },
    { fields: ['city'] }
  ]
});