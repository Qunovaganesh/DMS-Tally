import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/database';
import { VoucherType, PartyType, VoucherSource, VoucherStatus } from '@bizzplus/types';

export class Voucher extends Model {
  public id!: string;
  public type!: VoucherType;
  public partyType!: PartyType;
  public partyId!: string;
  public source!: VoucherSource;
  public externalId!: string | null;
  public payloadJson!: any;
  public status!: VoucherStatus;
  public sentAt!: Date | null;
  public errorMessage!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Voucher.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('sales', 'purchase', 'receipt', 'payment'),
    allowNull: false
  },
  partyType: {
    type: DataTypes.ENUM('manufacturer', 'distributor'),
    allowNull: false,
    field: 'party_type'
  },
  partyId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'party_id'
  },
  source: {
    type: DataTypes.ENUM('system', 'tally'),
    allowNull: false,
    defaultValue: 'system'
  },
  externalId: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'external_id'
  },
  payloadJson: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'payload_json'
  },
  status: {
    type: DataTypes.ENUM('queued', 'sent', 'error'),
    allowNull: false,
    defaultValue: 'queued'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'sent_at'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message'
  }
}, {
  sequelize,
  modelName: 'Voucher',
  tableName: 'vouchers',
  indexes: [
    { fields: ['type'] },
    { fields: ['party_type', 'party_id'] },
    { fields: ['source'] },
    { fields: ['status'] },
    { fields: ['external_id'] }
  ]
});