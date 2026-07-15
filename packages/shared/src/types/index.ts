// ═══════════════════════════════════════════════════════════════
// NexaStore Shared Types
// Shared type definitions used across frontend and backend
// ═══════════════════════════════════════════════════════════════

// ─── User Roles ──────────────────────────────────────────────
export enum UserRole {
  GUEST = 'GUEST',
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  MODERATOR = 'MODERATOR',
  DELIVERY_STAFF = 'DELIVERY_STAFF',
  WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER',
}

// ─── Auth Provider ───────────────────────────────────────────
export enum AuthProvider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  GITHUB = 'GITHUB',
}

// ─── Product ─────────────────────────────────────────────────
export enum ProductType {
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

// ─── Order ───────────────────────────────────────────────────
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
  REFUNDED = 'REFUNDED',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
}

/** Valid transitions for the order state machine */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.PACKED, OrderStatus.CANCELLED],
  [OrderStatus.PACKED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURNED, OrderStatus.REFUNDED, OrderStatus.PARTIAL_REFUND],
  [OrderStatus.CANCELLED]: [OrderStatus.REFUNDED],
  [OrderStatus.RETURNED]: [OrderStatus.REFUNDED, OrderStatus.PARTIAL_REFUND],
  [OrderStatus.REFUNDED]: [],
  [OrderStatus.PARTIAL_REFUND]: [OrderStatus.REFUNDED],
};

// ─── Payment ─────────────────────────────────────────────────
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  COD = 'COD',
  WALLET = 'WALLET',
}

// ─── Refund ──────────────────────────────────────────────────
export enum RefundStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

// ─── Inventory ───────────────────────────────────────────────
export enum TransferStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum InventoryLogType {
  STOCK_IN = 'STOCK_IN',
  STOCK_OUT = 'STOCK_OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
  RETURN = 'RETURN',
  DAMAGE = 'DAMAGE',
}

// ─── Discount ────────────────────────────────────────────────
export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
}

// ─── Support ─────────────────────────────────────────────────
export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// ─── Notification ────────────────────────────────────────────
export enum NotificationType {
  ORDER = 'ORDER',
  PAYMENT = 'PAYMENT',
  SHIPPING = 'SHIPPING',
  PROMOTION = 'PROMOTION',
  SYSTEM = 'SYSTEM',
  REVIEW = 'REVIEW',
}

// ─── Content ─────────────────────────────────────────────────
export enum PageStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum BlogStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum BannerPosition {
  HEADER = 'HEADER',
  SIDEBAR = 'SIDEBAR',
  FOOTER = 'FOOTER',
  POPUP = 'POPUP',
}

export enum HomepageSectionType {
  FEATURED_PRODUCTS = 'FEATURED_PRODUCTS',
  CATEGORIES = 'CATEGORIES',
  BRANDS = 'BRANDS',
  BANNER = 'BANNER',
  CUSTOM = 'CUSTOM',
}

export enum WalletTransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export enum RewardPointType {
  EARNED = 'EARNED',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
  ADJUSTED = 'ADJUSTED',
}

export enum VerificationTokenType {
  EMAIL_VERIFY = 'EMAIL_VERIFY',
  PASSWORD_RESET = 'PASSWORD_RESET',
  TWO_FACTOR = 'TWO_FACTOR',
}

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  ORDERED = 'ORDERED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export enum RelatedProductType {
  CROSS_SELL = 'CROSS_SELL',
  UP_SELL = 'UP_SELL',
  RELATED = 'RELATED',
}

export enum AnalyticsEventType {
  PAGE_VIEW = 'PAGE_VIEW',
  PRODUCT_VIEW = 'PRODUCT_VIEW',
  ADD_TO_CART = 'ADD_TO_CART',
  PURCHASE = 'PURCHASE',
  SEARCH = 'SEARCH',
}

// ─── API Response Interfaces ─────────────────────────────────
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: ValidationError[];
  stack?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// ─── User Interfaces ─────────────────────────────────────────
export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatar?: string | null;
  role: UserRole;
  isVerified: boolean;
  isBanned: boolean;
  twoFactorEnabled: boolean;
  provider: AuthProvider;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAddress {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

// ─── Product Interfaces ──────────────────────────────────────
export interface IProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  sku: string;
  barcode?: string | null;
  basePrice: number;
  salePrice?: number | null;
  type: ProductType;
  status: ProductStatus;
  categoryId: string;
  brandId?: string | null;
  tags: string[];
  isFeatured: boolean;
  avgRating: number;
  totalReviews: number;
  totalSold: number;
  createdAt: Date;
}

export interface IProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  color?: string | null;
  colorHex?: string | null;
  size?: string | null;
  storage?: string | null;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  isDefault: boolean;
  isActive: boolean;
}

// ─── Order Interfaces ────────────────────────────────────────
export interface IOrder {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentProvider;
  paymentStatus: PaymentStatus;
  trackingNumber?: string | null;
  estimatedDelivery?: Date | null;
  createdAt: Date;
}

// ─── Cart Interfaces ─────────────────────────────────────────
export interface ICartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  product?: IProduct;
  variant?: IProductVariant;
}

export interface ICart {
  id: string;
  items: ICartItem[];
  subtotal: number;
  itemCount: number;
}

// ─── Auth Interfaces ─────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: IUser;
  tokens: AuthTokens;
}
