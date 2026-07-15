// ═══════════════════════════════════════════════════════════════
// NexaStore Shared Validators
// Reusable Zod schemas shared across frontend and backend
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';

// ─── Primitives ──────────────────────────────────────────────

/** UUID v4 validation */
export const idSchema = z.string().uuid('Invalid ID format');

/** Email validation */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must not exceed 255 characters')
  .transform((v) => v.toLowerCase().trim());

/** Password: min 8, uppercase, lowercase, number, special char */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[@$!%*?&#^()_+\-=]/, 'Password must contain at least one special character');

/** Phone number: E.164 format */
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional()
  .or(z.literal(''));

/** URL-safe slug */
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format')
  .min(2, 'Slug must be at least 2 characters')
  .max(200, 'Slug must not exceed 200 characters');

/** Generic name field */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must not exceed 100 characters')
  .transform((v) => v.trim());

/** Generic description field */
export const descriptionSchema = z
  .string()
  .max(5000, 'Description must not exceed 5000 characters')
  .optional()
  .or(z.literal(''));

/** Price field: positive decimal with 2 decimal places */
export const priceSchema = z
  .number()
  .positive('Price must be positive')
  .multipleOf(0.01, 'Price must have at most 2 decimal places')
  .max(999999.99, 'Price must not exceed 999,999.99');

/** Quantity field */
export const quantitySchema = z
  .number()
  .int('Quantity must be a whole number')
  .positive('Quantity must be positive')
  .max(10000, 'Quantity must not exceed 10,000');

/** SKU field */
export const skuSchema = z
  .string()
  .min(3, 'SKU must be at least 3 characters')
  .max(20, 'SKU must not exceed 20 characters')
  .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens');

/** Hex color */
export const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color')
  .optional();

// ─── Pagination ──────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
});

// ─── Address ─────────────────────────────────────────────────

export const addressSchema = z.object({
  label: z.string().min(1).max(50),
  fullName: z.string().min(2).max(100),
  phone: z.string().min(5).max(20),
  addressLine1: z.string().min(5).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  zipCode: z.string().min(3).max(20),
  country: z.string().min(2).max(100),
  isDefault: z.boolean().optional().default(false),
});

// ─── Product ─────────────────────────────────────────────────

export const productFilterSchema = z.object({
  categoryId: idSchema.optional(),
  brandId: idSchema.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  type: z.enum(['PHYSICAL', 'DIGITAL', 'SUBSCRIPTION']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK']).optional(),
  isFeatured: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
  hasDiscount: z.coerce.boolean().optional(),
  tags: z.string().optional(), // Comma-separated
}).merge(paginationSchema);

// ─── Review ──────────────────────────────────────────────────

export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  title: z.string().max(200).optional(),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(2000),
});

// ─── Coupon ──────────────────────────────────────────────────

export const couponCodeSchema = z
  .string()
  .min(3, 'Coupon code must be at least 3 characters')
  .max(30, 'Coupon code must not exceed 30 characters')
  .regex(/^[A-Z0-9-]+$/, 'Coupon code must contain only uppercase letters, numbers, and hyphens')
  .transform((v) => v.toUpperCase().trim());

// ─── Search ──────────────────────────────────────────────────

export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  inStock: z.coerce.boolean().optional(),
  sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'rating', 'newest', 'bestselling']).optional().default('relevance'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ─── Contact Form ────────────────────────────────────────────

export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
});

// ─── Newsletter ──────────────────────────────────────────────

export const newsletterSchema = z.object({
  email: emailSchema,
});
