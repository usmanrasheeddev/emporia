// ═══════════════════════════════════════════════════════════════
// Cart View Page
// Displays cart items list, quantity editors, and checkout actions
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Alert } from '@/components/ui/Alert/Alert';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import styles from './cart.module.css';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    items,
    subtotal,
    discountAmount,
    totalAmount,
    coupon,
    isLoading,
    fetchCart,
    updateItem,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCartStore();

  const [couponInput, setCouponInput] = React.useState('');
  const [couponError, setCouponError] = React.useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQtyChange = (itemId: string, currentQty: number, change: number, stock: number) => {
    const newQty = currentQty + change;
    if (newQty > 0 && newQty <= stock) {
      updateItem(itemId, newQty);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);

    if (!couponInput.trim()) return;

    try {
      await applyCoupon(couponInput.trim().toUpperCase());
      setCouponInput('');
    } catch (err: any) {
      setCouponError(err.message || 'Failed to apply coupon');
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <div className={styles.centerWrapper}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`${styles.pageContainer} container`}>
        <EmptyState
          title="Your Cart is Empty"
          description="Looks like you haven't added anything to your cart yet. Go grab some awesome products!"
          action={
            <Link href="/products">
              <Button variant="primary">Shop Products</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className={`${styles.pageContainer} container`}>
      <h1 className={styles.pageTitle}>Shopping Cart</h1>

      <div className={styles.layout}>
        {/* Items List */}
        <div className={styles.itemsColumn}>
          <div className={styles.tableHeader}>
            <span className={styles.thProduct}>Product</span>
            <span className={styles.thPrice}>Price</span>
            <span className={styles.thQuantity}>Quantity</span>
            <span className={styles.thSubtotal}>Subtotal</span>
            <span className={styles.thActions}></span>
          </div>

          <div className={styles.itemsList}>
            {items.map((item) => (
              <div key={item.id} className={styles.itemRow}>
                {/* Product details info */}
                <div className={styles.productCell}>
                  <img
                    src={item.image || 'https://placehold.co/100x100/e5e7eb/111827?text=Product'}
                    alt={item.productName}
                    className={styles.productImg}
                  />
                  <div className={styles.productDetails}>
                    <Link href={`/products/${item.productSlug}`} className={styles.productNameLink}>
                      <h3 className={styles.productName}>{item.productName}</h3>
                    </Link>
                    {item.variantName && (
                      <span className={styles.productVariant}>{item.variantName}</span>
                    )}
                    <span className={styles.productSku}>SKU: {item.sku}</span>
                  </div>
                </div>

                {/* Price */}
                <div className={styles.priceCell}>${item.price.toFixed(2)}</div>

                {/* Quantity */}
                <div className={styles.quantityCell}>
                  <div className={styles.quantityEditor}>
                    <button
                      onClick={() => handleQtyChange(item.id, item.quantity, -1, item.stock)}
                      className={styles.qtyBtn}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className={styles.qtyVal}>{item.quantity}</span>
                    <button
                      onClick={() => handleQtyChange(item.id, item.quantity, 1, item.stock)}
                      className={styles.qtyBtn}
                      disabled={item.quantity >= item.stock}
                    >
                      +
                    </button>
                  </div>
                  {item.quantity >= item.stock && (
                    <span className={styles.stockLimitLabel}>Max stock reached</span>
                  )}
                </div>

                {/* Subtotal */}
                <div className={styles.subtotalCell}>${item.total.toFixed(2)}</div>

                {/* Actions */}
                <div className={styles.actionCell}>
                  <button
                    onClick={() => removeItem(item.id)}
                    className={styles.removeBtn}
                    aria-label="Remove item"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.itemsFooter}>
            <Link href="/products">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
            <Button variant="ghost" onClick={clearCart} className={styles.clearBtn}>
              Clear Cart
            </Button>
          </div>
        </div>

        {/* Cart Summary */}
        <div className={styles.summaryColumn}>
          <Card padding="md" className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                <span>Discount</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className={styles.summaryDivider}></div>

            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Total</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>

            {/* Coupon Application */}
            <div className={styles.couponSection}>
              <h3 className={styles.couponTitle}>Apply Promo Code</h3>
              {couponError && <Alert variant="error">{couponError}</Alert>}
              {coupon ? (
                <div className={styles.appliedCoupon}>
                  <div className={styles.couponInfo}>
                    <strong>{coupon.code}</strong> Applied (
                    {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : `$${coupon.value}`} off)
                  </div>
                  <button onClick={removeCoupon} className={styles.removeCouponBtn}>
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className={styles.couponForm}>
                  <div className={styles.couponInputWrapper}>
                    <Input
                      id="couponCode"
                      placeholder="ENTER CODE"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                    />
                  </div>
                  <Button type="submit" variant="outline">
                    Apply
                  </Button>
                </form>
              )}
            </div>

            <Button
              variant="primary"
              fullWidth
              size="lg"
              className={styles.checkoutBtn}
              onClick={() => {
                if (isAuthenticated) {
                  router.push('/checkout');
                } else {
                  router.push('/login?redirect=/checkout');
                }
              }}
            >
              Proceed to Checkout
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
