import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { WebhookKind } from '@bizzplus/types';

export class Webhook extends Model {
  public id!: string;
  public kind!: WebhookKind;
  public hmacSecret!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Webhook.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  kind: {
    type: DataTypes.ENUM('tdl_ingest_sku', 'tdl_delta', 'distributor_ingest'),
    allowNull: false
  },
  hmacSecret: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'hmac_secret'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  sequelize,
  modelName: 'Webhook',
  tableName: 'webhooks',
  indexes: [
    { fields: ['kind'] },
    { fields: ['is_active'] }
  ]
});