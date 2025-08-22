import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { UserRole, UserStatus } from '@bizzplus/types';

export class User extends Model {
  public id!: string;
  public role!: UserRole;
  public email!: string;
  public phone!: string;
  public passwordHash!: string;
  public status!: UserStatus;
  public lastLoginAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'manufacturer', 'distributor'),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash'
  },
  status: {
    type: DataTypes.ENUM('active', 'pending_reset', 'disabled'),
    allowNull: false,
    defaultValue: 'active'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    field: 'last_login_at'
  }
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  indexes: [
    { fields: ['email'] },
    { fields: ['phone'] },
    { fields: ['role'] },
    { fields: ['status'] }
  ]
});