import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { RelationshipStatus } from '@bizzplus/types';

export class ManufacturerDistributor extends Model {
  public id!: string;
  public manufacturerId!: string;
  public distributorId!: string;
  public status!: RelationshipStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ManufacturerDistributor.init({
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
    type: DataTypes.ENUM('lead', 'prospect', 'customer'),
    allowNull: false,
    defaultValue: 'lead'
  }
}, {
  sequelize,
  modelName: 'ManufacturerDistributor',
  tableName: 'manufacturer_distributor',
  indexes: [
    { 
      fields: ['manufacturer_id', 'distributor_id'],
      unique: true
    },
    { fields: ['status'] }
  ]
});