// User & Auth Types
export type UserRole = 'admin' | 'manufacturer' | 'distributor';
export type UserStatus = 'active' | 'pending_reset' | 'disabled';

export interface User {
  id: string;
  role: UserRole;
  email: string;
  phone: string;
  status: UserStatus;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

// Entity Types
export type EntityType = 'manufacturer' | 'distributor';
export type RelationshipStatus = 'lead' | 'prospect' | 'customer';

export interface Manufacturer {
  id: string;
  name: string;
  gstin?: string;
  city?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Distributor {
  id: string;
  name: string;
  gstin?: string;
  city?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ManufacturerDistributor {
  id: string;
  manufacturerId: string;
  distributorId: string;
  status: RelationshipStatus;
  manufacturer?: Manufacturer;
  distributor?: Distributor;
}

// SKU & Pricing Types
export interface SKU {
  id: string;
  manufacturerId: string;
  skuCode: string;
  name: string;
  hsn?: string;
  gstPercent: number;
  uom: string;
  currentPrice?: number;
  manufacturer?: Manufacturer;
  createdAt: Date;
  updatedAt: Date;
}

export interface SKUPrice {
  id: string;
  skuId: string;
  price: number;
  currency: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  sku?: SKU;
}

// Order Types
export type OrderStatus = 'draft' | 'placed' | 'accepted' | 'rejected' | 'fulfilled';

export interface Order {
  id: string;
  number: string;
  manufacturerId: string;
  distributorId: string;
  status: OrderStatus;
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  placedAt?: Date;
  fulfilledAt?: Date;
  createdBy: string;
  manufacturer?: Manufacturer;
  distributor?: Distributor;
  items?: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  skuId: string;
  qty: number;
  rate: number;
  gstPercent: number;
  lineTotal: number;
  lineGst: number;
  lineGrandTotal: number;
  sku?: SKU;
  order?: Order;
}

export interface CreateOrderRequest {
  manufacturerId: string;
  items: {
    skuId: string;
    qty: number;
  }[];
}

// Inventory Types
export interface InventoryBalance {
  id: string;
  distributorId: string;
  skuId: string;
  onHand: number;
  reserved: number;
  updatedAt: Date;
  distributor?: Distributor;
  sku?: SKU;
}

// Voucher Types
export type VoucherType = 'sales' | 'purchase' | 'receipt' | 'payment';
export type PartyType = 'manufacturer' | 'distributor';
export type VoucherSource = 'system' | 'tally';
export type VoucherStatus = 'queued' | 'sent' | 'error';

export interface Voucher {
  id: string;
  type: VoucherType;
  partyType: PartyType;
  partyId: string;
  source: VoucherSource;
  externalId?: string;
  payloadJson: any;
  status: VoucherStatus;
  sentAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Session Types
export interface Session {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  revokedAt?: Date;
  user?: User;
}

// CRM Types
export interface CRMContact {
  id: string;
  entityType: EntityType;
  entityId: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  updatedFromCrmAt?: Date;
}

// Webhook Types
export type WebhookKind = 'tdl_ingest_sku' | 'tdl_delta' | 'distributor_ingest';

export interface Webhook {
  id: string;
  kind: WebhookKind;
  hmacSecret: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Audit Types
export interface AuditLog {
  id: string;
  actorUserId?: string;
  event: string;
  entity: string;
  entityId: string;
  diff: any;
  createdAt: Date;
  actor?: User;
}

// Dashboard Types
export interface ManufacturerDashboard {
  kpis: {
    openOrders: number;
    todaysFulfillments: number;
    todaysValue: number;
  };
  latestOrders: Order[];
  priceChanges: SKUPrice[];
}

export interface DistributorDashboard {
  kpis: {
    onHandSkus: number;
    lowStock: number;
    openPos: number;
    recentSales: number;
  };
  alerts: {
    negativeStock: InventoryBalance[];
    pendingReceipts: Voucher[];
  };
  recentVouchers: Voucher[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// TDL Ingestion Types
export interface TDLSKUIngestion {
  manufacturerId: string;
  skuCode: string;
  name: string;
  hsn?: string;
  gstPercent: number;
  uom: string;
}

export interface TDLPriceIngestion {
  manufacturerId: string;
  skuCode: string;
  price: number;
  currency: string;
  effectiveFrom: string;
}

// Form Types
export interface OrderFormData {
  manufacturerId: string;
  items: {
    skuId: string;
    qty: number;
    rate: number;
    gstPercent: number;
  }[];
}

export interface OrderTotals {
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
}