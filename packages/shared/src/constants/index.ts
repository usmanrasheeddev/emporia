// ═══════════════════════════════════════════════════════════════
// NexaStore Shared Constants
// Application-wide constants shared across frontend and backend
// ═══════════════════════════════════════════════════════════════

import { UserRole, OrderStatus, PaymentProvider, ProductType, ProductStatus } from '../types';

// ─── Pagination Defaults ─────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

// ─── Cache TTL (seconds) ─────────────────────────────────────
export const CACHE_TTL = {
  SESSION: 7 * 24 * 60 * 60,        // 7 days
  PRODUCT: 60 * 60,                  // 1 hour
  PRODUCT_LIST: 5 * 60,              // 5 minutes
  CATEGORY_TREE: 24 * 60 * 60,       // 24 hours
  CART: 30 * 24 * 60 * 60,           // 30 days
  SEARCH_AUTOCOMPLETE: 60 * 60,      // 1 hour
  ANALYTICS: 24 * 60 * 60,           // 24 hours
  BRANDS: 12 * 60 * 60,              // 12 hours
  SHORT: 60,                         // 1 minute
} as const;

// ─── Rate Limiting ───────────────────────────────────────────
export const RATE_LIMIT = {
  AUTH: { windowMs: 60 * 1000, max: 5 },        // 5 req/min for auth endpoints
  API: { windowMs: 60 * 1000, max: 100 },        // 100 req/min general
  UPLOAD: { windowMs: 60 * 1000, max: 10 },      // 10 req/min for uploads
  SEARCH: { windowMs: 60 * 1000, max: 30 },      // 30 req/min for search
} as const;

// ─── File Upload ─────────────────────────────────────────────
export const UPLOAD = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,               // 5 MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024,              // 50 MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024,           // 10 MB
  MAX_IMAGES_PER_PRODUCT: 10,
  MAX_VIDEOS_PER_PRODUCT: 3,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],
  CLOUDINARY_FOLDERS: {
    PRODUCTS: 'nexastore/products',
    AVATARS: 'nexastore/avatars',
    BRANDS: 'nexastore/brands',
    CATEGORIES: 'nexastore/categories',
    BANNERS: 'nexastore/banners',
    BLOG: 'nexastore/blog',
  },
} as const;

// ─── Regex Patterns ──────────────────────────────────────────
export const REGEX = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  /** Minimum 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character */
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  SKU: /^[A-Z0-9-]{3,20}$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  ZIP_CODE: /^\d{5}(-\d{4})?$/,
} as const;

// ─── User Roles Metadata ────────────────────────────────────
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.GUEST]: 'Guest',
  [UserRole.CUSTOMER]: 'Customer',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.MODERATOR]: 'Moderator',
  [UserRole.DELIVERY_STAFF]: 'Delivery Staff',
  [UserRole.WAREHOUSE_MANAGER]: 'Warehouse Manager',
};

/** Roles that can access the admin dashboard */
export const ADMIN_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.MODERATOR,
];

/** Roles that can manage inventory */
export const INVENTORY_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.WAREHOUSE_MANAGER,
];

// ─── Order Status Metadata ───────────────────────────────────
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pending',
  [OrderStatus.CONFIRMED]: 'Confirmed',
  [OrderStatus.PROCESSING]: 'Processing',
  [OrderStatus.PACKED]: 'Packed',
  [OrderStatus.SHIPPED]: 'Shipped',
  [OrderStatus.DELIVERED]: 'Delivered',
  [OrderStatus.CANCELLED]: 'Cancelled',
  [OrderStatus.RETURNED]: 'Returned',
  [OrderStatus.REFUNDED]: 'Refunded',
  [OrderStatus.PARTIAL_REFUND]: 'Partial Refund',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '#f59e0b',
  [OrderStatus.CONFIRMED]: '#3b82f6',
  [OrderStatus.PROCESSING]: '#8b5cf6',
  [OrderStatus.PACKED]: '#6366f1',
  [OrderStatus.SHIPPED]: '#0ea5e9',
  [OrderStatus.DELIVERED]: '#10b981',
  [OrderStatus.CANCELLED]: '#ef4444',
  [OrderStatus.RETURNED]: '#f97316',
  [OrderStatus.REFUNDED]: '#6b7280',
  [OrderStatus.PARTIAL_REFUND]: '#9ca3af',
};

// ─── Payment Methods ─────────────────────────────────────────
export const PAYMENT_METHOD_LABELS: Record<PaymentProvider, string> = {
  [PaymentProvider.STRIPE]: 'Credit/Debit Card',
  [PaymentProvider.PAYPAL]: 'PayPal',
  [PaymentProvider.COD]: 'Cash on Delivery',
  [PaymentProvider.WALLET]: 'Wallet Balance',
};

// ─── Product Types ───────────────────────────────────────────
export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  [ProductType.PHYSICAL]: 'Physical Product',
  [ProductType.DIGITAL]: 'Digital Product',
  [ProductType.SUBSCRIPTION]: 'Subscription',
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  [ProductStatus.DRAFT]: 'Draft',
  [ProductStatus.ACTIVE]: 'Active',
  [ProductStatus.ARCHIVED]: 'Archived',
  [ProductStatus.OUT_OF_STOCK]: 'Out of Stock',
};

// ─── Currencies ──────────────────────────────────────────────
export const DEFAULT_CURRENCY = 'USD';
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'AED', 'SAR'] as const;

// ─── Reward Points ───────────────────────────────────────────
export const REWARD_POINTS = {
  PER_DOLLAR: 1,              // 1 point per dollar spent
  REDEMPTION_RATE: 0.01,      // $0.01 per point
  SIGNUP_BONUS: 100,          // 100 points on signup
  REVIEW_BONUS: 50,           // 50 points per review
  EXPIRY_DAYS: 365,           // Points expire after 1 year
} as const;

// ─── Application ─────────────────────────────────────────────
export const APP = {
  NAME: 'NexaStore',
  DESCRIPTION: 'Enterprise E-Commerce Platform',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@nexastore.com',
  DEFAULT_AVATAR: '/images/default-avatar.png',
  LOW_STOCK_THRESHOLD: 5,
  FREE_SHIPPING_THRESHOLD: 50,        // Free shipping above $50
  MAX_CART_ITEMS: 50,
  MAX_COMPARE_ITEMS: 4,
  MAX_WISHLIST_ITEMS: 200,
  SEARCH_DEBOUNCE_MS: 300,
  OTP_LENGTH: 6,
} as const;
