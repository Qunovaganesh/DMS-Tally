import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { EntityType } from '@bizzplus/types';

export class CRMContact extends Model {
  public id!: string;
  public entityType!: EntityType;
  public entityId!: string;
  public email!: string;
  public phone!: string;
  public isPrimary!: boolean;
  public updatedFromCrmAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CRMContact.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  entityType: {
    type: DataTypes.ENUM('manufacturer', 'distributor'),
    allowNull: false,
    field: 'entity_type'
  },
  entityId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'entity_id'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isPrimary: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_primary'
  },
  updatedFromCrmAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'updated_from_crm_at'
  }
}, {
  sequelize,
  modelName: 'CRMContact',
  tableName: 'crm_contacts',
  indexes: [
    { fields: ['entity_type', 'entity_id'] },
    { fields: ['email'] },
    { fields: ['phone'] },
    { fields: ['is_primary'] }
  ]
});