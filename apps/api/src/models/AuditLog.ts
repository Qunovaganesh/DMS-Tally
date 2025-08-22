import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class AuditLog extends Model {
  public id!: string;
  public actorUserId!: string | null;
  public event!: string;
  public entity!: string;
  public entityId!: string;
  public diff!: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AuditLog.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  actorUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'actor_user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  event: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entity: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'entity_id'
  },
  diff: {
    type: DataTypes.JSONB,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'AuditLog',
  tableName: 'audit_logs',
  indexes: [
    { fields: ['actor_user_id'] },
    { fields: ['event'] },
    { fields: ['entity'] },
    { fields: ['entity_id'] },
    { fields: ['created_at'] }
  ]
});