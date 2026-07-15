import { create } from 'zustand';
import { api, ApiClientError } from '@/lib/api';
import type { CartItem, CartSummary, AppliedCoupon, ApiResponse } from '@/types';

interface CartState {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  discountAmount: number;
  totalAmount: number;
  coupon: AppliedCoupon | null;
  isLoading: boolean;

  fetchCart: () => Promise<void>;
  addToCart: (productId: string, variantId: string | null, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
}

function applyCartData(cart: CartSummary): Partial<CartState> {
  return {
    items: cart.items,
    subtotal: cart.subtotal,
    itemCount: cart.itemCount,
    discountAmount: cart.discountAmount,
    totalAmount: cart.totalAmount,
    coupon: cart.coupon,
  };
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  subtotal: 0,
  itemCount: 0,
  discountAmount: 0,
  totalAmount: 0,
  coupon: null,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get<ApiResponse<CartSummary>>('/cart');
      set({ ...applyCartData(response.data), isLoading: false });
    } catch {
      // Silently handle cart fetch errors (e.g. unauthenticated guest users)
      set({ isLoading: false });
    }
  },

  addToCart: async (productId: string, variantId: string | null, quantity: number) => {
    set({ isLoading: true });
    try {
      const response = await api.post<ApiResponse<CartSummary>>('/cart/items', {
        productId,
        variantId,
        quantity,
      });
      set({ ...applyCartData(response.data), isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to add item to cart.');
    }
  },

  updateItem: async (itemId: string, quantity: number) => {
    set({ isLoading: true });
    try {
      const response = await api.patch<ApiResponse<CartSummary>>(
        `/cart/items/${itemId}`,
        { quantity },
      );
      set({ ...applyCartData(response.data), isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to update cart item.');
    }
  },

  removeItem: async (itemId: string) => {
    set({ isLoading: true });
    try {
      const response = await api.delete<ApiResponse<CartSummary>>(
        `/cart/items/${itemId}`,
      );
      set({ ...applyCartData(response.data), isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to remove cart item.');
    }
  },

  clearCart: async () => {
    set({ isLoading: true });
    try {
      await api.delete<ApiResponse<null>>('/cart');
      set({
        items: [],
        subtotal: 0,
        itemCount: 0,
        discountAmount: 0,
        totalAmount: 0,
        coupon: null,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to clear cart.');
    }
  },

  applyCoupon: async (code: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post<ApiResponse<CartSummary>>(
        '/cart/coupon',
        { code },
      );
      set({ ...applyCartData(response.data), isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to apply coupon.');
    }
  },

  removeCoupon: async () => {
    set({ isLoading: true });
    try {
      const response = await api.delete<ApiResponse<CartSummary>>('/cart/coupon');
      set({ ...applyCartData(response.data), isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to remove coupon.');
    }
  },
}));
