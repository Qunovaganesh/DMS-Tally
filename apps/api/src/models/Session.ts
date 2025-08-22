import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';

export class Session extends Model {
  public id!: string;
  public userId!: string;
  public refreshTokenHash!: string;
  public userAgent!: string | null;
  public ip!: string | null;
  public revokedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Session.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  refreshTokenHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'refresh_token_hash'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent'
  },
  ip: {
    type: DataTypes.INET,
    allowNull: true
  },
  revokedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'revoked_at'
  }
}, {
  sequelize,
  modelName: 'Session',
  tableName: 'sessions',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['revoked_at'] }
  ]
});