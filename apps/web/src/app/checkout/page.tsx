// ═══════════════════════════════════════════════════════════════
// Checkout Page
// Coordinates address selectors, shipping estimates, and payment processing
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Alert } from '@/components/ui/Alert/Alert';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import Link from 'next/link';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { items, subtotal, discountAmount, fetchCart } = useCartStore();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'PAYPAL' | 'COD' | 'WALLET'>('COD');
  const [error, setError] = useState<string | null>(null);

  // Auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (isAuthenticated === false) {
      router.replace('/login?redirect=/checkout');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Fetch customer address list
  const { data: addressResponse, isLoading: addressLoading } = useQuery({
    queryKey: ['my-addresses'],
    queryFn: () => api.get<any>('/users/me/addresses'),
    enabled: isAuthenticated,
  });

  const addresses = addressResponse?.data || [];

  // Set default address
  useEffect(() => {
    if (addresses.length > 0) {
      const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }
    }
  }, [addresses]);

  // Fetch shipping and tax estimates
  const { data: estimateData, isLoading: estimateLoading } = useQuery({
    queryKey: ['shipping-estimate', selectedAddressId, subtotal],
    queryFn: () =>
      api.post<any>('/shipping/estimate', {
        addressId: selectedAddressId,
        subtotal,
      }),
    enabled: !!selectedAddressId && subtotal > 0,
  });

  const estimation = estimateData?.data;
  const shippingOptions = estimation?.shippingOptions || [];
  const tax = estimation?.tax || { name: 'No Tax', rate: 0, amount: 0 };

  // Set default shipping method
  useEffect(() => {
    if (shippingOptions.length > 0) {
      setSelectedMethodId(shippingOptions[0].id);
    }
  }, [shippingOptions]);

  // Resolve totals
  const selectedShipping = shippingOptions.find((o: any) => o.id === selectedMethodId);
  const shippingAmount = selectedShipping ? selectedShipping.rate : 0;
  const taxAmount = tax.amount;
  const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount + shippingAmount);

  // checkout execution mutation
  const checkoutMutation = useMutation({
    mutationFn: (payload: any) => api.post<any>('/orders', payload),
    onSuccess: async (orderRes) => {
      const order = orderRes.data;
      if (!order) return;

      // Handle external payment redirect if Stripe / PayPal
      if (paymentMethod === 'STRIPE') {
        try {
          const res = await api.post<any>('/payments/stripe/session', { orderId: order.id });
          if (res.data?.sessionUrl) {
            window.location.href = res.data.sessionUrl;
            return;
          }
        } catch (err: any) {
          setError(err.message || 'Failed to initialize Stripe payment session');
        }
      } else if (paymentMethod === 'PAYPAL') {
        try {
          const res = await api.post<any>('/payments/paypal/session', { orderId: order.id });
          if (res.data?.approvalUrl) {
            window.location.href = res.data.approvalUrl;
            return;
          }
        } catch (err: any) {
          setError(err.message || 'Failed to initialize PayPal session');
        }
      } else if (paymentMethod === 'WALLET') {
        try {
          await api.post('/payments/wallet', { orderId: order.id });
          router.push(`/checkout/success?order_id=${order.id}`);
          return;
        } catch (err: any) {
          setError(err.message || 'Wallet payment deduction failed');
        }
      } else {
        // COD path completes directly
        router.push(`/checkout/success?order_id=${order.id}`);
      }
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to place order. Please review details.');
    },
  });

  const handlePlaceOrder = () => {
    setError(null);

    if (!selectedAddressId) {
      setError('Please select a shipping address');
      return;
    }

    if (!selectedMethodId) {
      setError('Please select a shipping delivery method');
      return;
    }

    checkoutMutation.mutate({
      addressId: selectedAddressId,
      paymentMethod,
      shippingMethodId: selectedMethodId,
    });
  };

  if (addressLoading) {
    return (
      <div className={styles.centerWrapper}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`${styles.pageContainer} container`}>
      <h1 className={styles.pageTitle}>Secure Checkout</h1>

      {error && <Alert variant="error">{error}</Alert>}

      <div className={styles.layout}>
        {/* Checkout Forms Column */}
        <div className={styles.formsColumn}>
          {/* Address Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>1. Shipping Address</h2>
            {addresses.length === 0 ? (
              <div className={styles.noAddressBox}>
                <p>No shipping addresses found in your account.</p>
                <Link href="/dashboard/addresses">
                  <Button variant="outline">Add New Address</Button>
                </Link>
              </div>
            ) : (
              <div className={styles.addressesGrid}>
                {addresses.map((addr: any) => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`${styles.addressOption} ${selectedAddressId === addr.id ? styles.activeAddress : ''}`}
                  >
                    <div className={styles.addressLabel}>
                      <strong>{addr.label}</strong>
                      {addr.isDefault && <span className={styles.defaultTag}>Default</span>}
                    </div>
                    <div className={styles.addressText}>{addr.fullName}</div>
                    <div className={styles.addressText}>{addr.addressLine1}</div>
                    {addr.addressLine2 && <div className={styles.addressText}>{addr.addressLine2}</div>}
                    <div className={styles.addressText}>
                      {addr.city}, {addr.state} {addr.zipCode}
                    </div>
                    <div className={styles.addressText}>{addr.country}</div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Shipping Methods Section */}
          {selectedAddressId && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>2. Delivery Method</h2>
              {estimateLoading ? (
                <Spinner />
              ) : shippingOptions.length === 0 ? (
                <p className={styles.emptyMsg}>No shipping options available for this destination.</p>
              ) : (
                <div className={styles.optionsList}>
                  {shippingOptions.map((method: any) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethodId(method.id)}
                      className={`${styles.optionItem} ${selectedMethodId === method.id ? styles.activeOption : ''}`}
                    >
                      <div className={styles.optionDetails}>
                        <strong>{method.name}</strong>
                        <span className={styles.optionDesc}>{method.description}</span>
                        <span className={styles.optionTime}>Est. delivery: {method.estimatedDays} days</span>
                      </div>
                      <span className={styles.optionRate}>
                        {method.rate === 0 ? 'FREE' : `$${method.rate.toFixed(2)}`}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Payment method Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>3. Payment Method</h2>
            <div className={styles.optionsList}>
              <button
                onClick={() => setPaymentMethod('COD')}
                className={`${styles.optionItem} ${paymentMethod === 'COD' ? styles.activeOption : ''}`}
              >
                <div>
                  <strong>Cash on Delivery (COD)</strong>
                  <span className={styles.optionDesc}>Pay in cash when order is delivered</span>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('STRIPE')}
                className={`${styles.optionItem} ${paymentMethod === 'STRIPE' ? styles.activeOption : ''}`}
              >
                <div>
                  <strong>Credit / Debit Card (Stripe)</strong>
                  <span className={styles.optionDesc}>Pay securely online using credit card</span>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('PAYPAL')}
                className={`${styles.optionItem} ${paymentMethod === 'PAYPAL' ? styles.activeOption : ''}`}
              >
                <div>
                  <strong>PayPal Payment</strong>
                  <span className={styles.optionDesc}>Pay online using your PayPal account balance</span>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('WALLET')}
                className={`${styles.optionItem} ${paymentMethod === 'WALLET' ? styles.activeOption : ''}`}
              >
                <div>
                  <strong>NexaStore Account Wallet</strong>
                  <span className={styles.optionDesc}>Pay using pre-loaded wallet credit balances</span>
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* Order review Column */}
        <div className={styles.reviewColumn}>
          <Card padding="md" className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            <div className={styles.itemsList}>
              {items.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <div className={styles.itemMain}>
                    <span className={styles.itemName}>{item.productName}</span>
                    {item.variantName && (
                      <span className={styles.itemVariant}>{item.variantName}</span>
                    )}
                  </div>
                  <span className={styles.itemTotal}>
                    {item.quantity} &times; ${item.price.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.summaryDivider}></div>

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

            <div className={styles.summaryRow}>
              <span>Shipping ({selectedShipping?.name || 'Pending'})</span>
              <span>{shippingAmount === 0 ? 'FREE' : `$${shippingAmount.toFixed(2)}`}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Sales Tax ({tax.name})</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>

            <div className={styles.summaryDivider}></div>

            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Grand Total</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>

            <Button
              variant="primary"
              fullWidth
              size="lg"
              className={styles.checkoutBtn}
              onClick={handlePlaceOrder}
              loading={checkoutMutation.isPending}
            >
              Place Order
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
