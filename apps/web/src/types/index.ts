/* ============================================
   NexaStore — Frontend TypeScript Interfaces
   ============================================ */

// --- User & Auth ---

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN' | 'MODERATOR' | 'DELIVERY_STAFF' | 'WAREHOUSE_MANAGER' | 'GUEST';
  isVerified: boolean;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

// --- Product ---

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number | null;
  sku: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  category: Category;
  brand: Brand | null;
  images: ProductImage[];
  variants: ProductVariant[];
  specifications: ProductSpecification[];
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  attributes: Record<string, string>;
  image: ProductImage | null;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductSpecification {
  id: string;
  name: string;
  value: string;
  group: string | null;
}

// --- Category & Brand ---

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  children: Category[];
  productCount: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
}

// --- Cart ---

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  productSlug: string;
  image: string | null;
  sku: string;
  variantName: string | null;
  price: number;
  quantity: number;
  total: number;
  stock: number;
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  itemCount: number;
  coupon: AppliedCoupon | null;
}

export interface AppliedCoupon {
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
}

// --- Order ---

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  trackingNumber: string | null;
  notes: string | null;
  statusHistory: OrderStatusHistory[];
  coupon: AppliedCoupon | null;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  image: string;
  price: number;
  quantity: number;
  sku: string;
  variantName: string | null;
}

export interface OrderStatusHistory {
  id: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

// --- Reviews & Q&A ---

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  images: string[];
  createdAt: string;
}

export interface QuestionAnswer {
  id: string;
  productId: string;
  question: string;
  answer: string | null;
  askedBy: string;
  answeredBy: string | null;
  helpfulCount: number;
  createdAt: string;
  answeredAt: string | null;
}

// --- Coupon ---

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
}

// --- API ---

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// --- Search ---

export interface SearchResults {
  products: Product[];
  totalResults: number;
  facets: SearchFacets;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SearchFacets {
  categories: FacetBucket[];
  brands: FacetBucket[];
  priceRanges: FacetBucket[];
  ratings: FacetBucket[];
}

export interface FacetBucket {
  label: string;
  value: string;
  count: number;
}
