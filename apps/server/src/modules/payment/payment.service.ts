// ═══════════════════════════════════════════════════════════════
// Payment & Wallet Service Layer
// Orchestrates transactions, Stripe sessions, PayPal captures, and Wallet balances
// ═══════════════════════════════════════════════════════════════

import { PaymentRepository } from './payment.repository';
import { ApiError } from '../../utils/api-error';
import { prisma } from '../../config/database';
import { stripe } from '../../config/stripe';
import { createPayPalOrder, capturePayPalOrder } from '../../config/paypal';
import { PaymentStatus, PaymentProvider, WalletTransactionType, ORDER_TRANSITIONS } from '@nexastore/shared';
import { buildPaginationMeta } from '../../utils/pagination';
import { env } from '../../config/env';

export class PaymentService {
  private repo: PaymentRepository;

  constructor(repo: PaymentRepository) {
    this.repo = repo;
  }

  // ─── Stripe Payments ─────────────────────────────────────────

  async processStripePayment(orderId: string, userId: string): Promise<{ sessionUrl: string }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw ApiError.notFound('Order not found');
    if (order.userId !== userId) throw ApiError.forbidden('Unauthorized access');
    if (order.paymentStatus === 'COMPLETED') throw ApiError.badRequest('Order is already paid');

    const appUrl = env.NEXT_PUBLIC_APP_URL;

    const discountAmount = Number(order.discountAmount || 0);
    const shippingAmount = Number(order.shippingAmount || 0);
    const taxAmount = Number(order.taxAmount || 0);
    const expectedTotalCents = Math.round(Number(order.totalAmount) * 100);

    const discountCents = Math.round(discountAmount * 100);
    const shippingCents = Math.round(shippingAmount * 100);
    const taxCents = Math.round(taxAmount * 100);

    // Calculate raw items subtotal in cents
    const rawItemsSubtotalCents = order.items.reduce(
      (acc, item) => acc + Math.round(Number(item.price) * 100) * item.quantity,
      0
    );

    // Step 1: Map line items with net subtotal allocation and handle quantity > 1 remainders
    const lineItems: Array<{
      price_data: { currency: string; product_data: { name: string; description?: string }; unit_amount: number };
      quantity: number;
    }> = [];

    order.items.forEach((item) => {
      const itemSubtotalCents = Math.round(Number(item.price) * 100) * item.quantity;
      let allocatedDiscountCents = 0;

      if (discountCents > 0 && rawItemsSubtotalCents > 0) {
        allocatedDiscountCents = Math.min(
          itemSubtotalCents,
          Math.round((itemSubtotalCents / rawItemsSubtotalCents) * discountCents)
        );
      }

      const netItemSubtotalCents = Math.max(0, itemSubtotalCents - allocatedDiscountCents);
      const baseUnitAmountCents = item.quantity > 0 ? Math.floor(netItemSubtotalCents / item.quantity) : 0;
      const remainderCents = netItemSubtotalCents - baseUnitAmountCents * item.quantity;

      const desc = order.couponCode ? `Discount applied (${order.couponCode})` : undefined;

      if (remainderCents > 0 && remainderCents < item.quantity) {
        // Split item to preserve exact net item subtotal integer matching
        const baseQty = item.quantity - remainderCents;
        if (baseQty > 0) {
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: { name: item.name, ...(desc ? { description: desc } : {}) },
              unit_amount: baseUnitAmountCents,
            },
            quantity: baseQty,
          });
        }
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: { name: item.name, ...(desc ? { description: desc } : {}) },
            unit_amount: baseUnitAmountCents + 1,
          },
          quantity: remainderCents,
        });
      } else {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: { name: item.name, ...(desc ? { description: desc } : {}) },
            unit_amount: baseUnitAmountCents,
          },
          quantity: item.quantity,
        });
      }
    });

    // Step 2: Add shipping and tax lines if positive
    if (shippingCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Shipping Charges' },
          unit_amount: shippingCents,
        },
        quantity: 1,
      });
    }

    if (taxCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Estimated Sales Tax' },
          unit_amount: taxCents,
        },
        quantity: 1,
      });
    }

    // Step 3: Hardened Safe Penny Adjustment Distribution
    let calculatedTotalCents = lineItems.reduce(
      (sum, item) => sum + item.price_data.unit_amount * item.quantity,
      0
    );

    let pennyDelta = expectedTotalCents - calculatedTotalCents;

    if (pennyDelta !== 0 && lineItems.length > 0) {
      // Find candidate line items with quantity == 1 for safe penny adjustment without multiplier effect
      const productSingleQtyIndices = lineItems
        .map((item, idx) => ({ idx, item, totalVal: item.price_data.unit_amount * item.quantity }))
        .filter((x, idx) => idx < lineItems.length - (shippingCents > 0 ? 1 : 0) - (taxCents > 0 ? 1 : 0) && x.item.quantity === 1)
        .sort((a, b) => b.totalVal - a.totalVal);

      // Distribute pennyDelta step-by-step until pennyDelta === 0
      while (pennyDelta !== 0) {
        let adjustedInLoop = false;

        // Try single-qty product items first
        for (const target of productSingleQtyIndices) {
          if (pennyDelta === 0) break;
          const step = pennyDelta > 0 ? 1 : -1;
          const newUnitAmount = target.item.price_data.unit_amount + step;
          if (newUnitAmount >= 0) {
            target.item.price_data.unit_amount = newUnitAmount;
            pennyDelta -= step;
            adjustedInLoop = true;
          }
        }

        if (pennyDelta === 0) break;

        // Fallback: loop through all product items from highest to lowest value
        const sortedProductItems = lineItems
          .map((item, idx) => ({ item, val: item.price_data.unit_amount * item.quantity }))
          .filter((_, idx) => idx < lineItems.length - (shippingCents > 0 ? 1 : 0) - (taxCents > 0 ? 1 : 0))
          .sort((a, b) => b.val - a.val);

        for (const entry of sortedProductItems) {
          if (pennyDelta === 0) break;
          const step = pennyDelta > 0 ? 1 : -1;
          const newUnitAmount = entry.item.price_data.unit_amount + step;
          if (newUnitAmount >= 0) {
            entry.item.price_data.unit_amount = newUnitAmount;
            pennyDelta -= step * entry.item.quantity;
            adjustedInLoop = true;
          }
        }

        // Emergency break if no further non-negative adjustment can be made
        if (!adjustedInLoop) break;
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      metadata: {
        orderId,
        type: 'ORDER_PAYMENT',
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${appUrl}/checkout/cancel?order_id=${orderId}`,
    });

    // Create payment entry in database
    await this.repo.createPayment({
      orderId,
      provider: PaymentProvider.STRIPE,
      transactionId: session.id,
      amount: Number(order.totalAmount),
      status: PaymentStatus.PENDING,
    });

    return { sessionUrl: session.url || '' };
  }

  /**
   * Handle webhook event sent by Stripe server
   */
  async handleStripeWebhook(signature: string, rawBody: Buffer) {
    let event;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      throw ApiError.badRequest(`Webhook signature verification failed: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const { orderId, type, userId, amount } = session.metadata;

      await prisma.$transaction(async (tx) => {
        // ─── Case 1: Standard Checkout Order Payment ───────────
        if (type === 'ORDER_PAYMENT') {
          const order = await tx.order.findUnique({ where: { id: orderId } });
          if (!order) return;

          // Update Order payment status
          await tx.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'COMPLETED',
              status: 'CONFIRMED',
            },
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId,
              fromStatus: order.status,
              toStatus: 'CONFIRMED',
              note: 'Payment completed successfully via Stripe card',
            },
          });

          // Update payment record status
          const payment = await tx.payment.findFirst({
            where: { orderId, provider: 'STRIPE' },
            orderBy: { createdAt: 'desc' },
          });

          if (payment) {
            await tx.payment.update({
              where: { id: payment.id },
              data: {
                status: 'COMPLETED',
                transactionId: session.payment_intent || session.id,
                paidAt: new Date(),
              },
            });
          }
        }

        // ─── Case 2: User Wallet Top-Up ────────────────────────
        if (type === 'WALLET_TOPUP') {
          const wallet = await tx.wallet.findUnique({ where: { userId } });
          if (!wallet) return;

          const topUpAmount = parseFloat(amount);
          const newBalance = Number(wallet.balance) + topUpAmount;

          // Credit wallet
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: newBalance },
          });

          // Log wallet transaction
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: WalletTransactionType.CREDIT,
              amount: topUpAmount,
              description: 'Wallet top-up via Stripe card',
              referenceId: session.id,
              referenceType: 'STRIPE_SESSION',
              balance: newBalance,
            },
          });
        }
      });
    }
  }

  // ─── PayPal Payments ─────────────────────────────────────────

  async processPayPalPayment(orderId: string, userId: string): Promise<{ approvalUrl: string }> {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw ApiError.notFound('Order not found');
    if (order.userId !== userId) throw ApiError.forbidden('Unauthorized access');
    if (order.paymentStatus === 'COMPLETED') throw ApiError.badRequest('Order is already paid');

    const paypalOrder = await createPayPalOrder(
      Number(order.totalAmount),
      'USD',
      `Order #${order.orderNumber}`
    );

    // Save payment log
    await this.repo.createPayment({
      orderId,
      provider: PaymentProvider.PAYPAL,
      transactionId: paypalOrder.id,
      amount: Number(order.totalAmount),
      status: PaymentStatus.PENDING,
    });

    return { approvalUrl: paypalOrder.approvalUrl };
  }

  async verifyPayPalPayment(orderId: string, paypalOrderId: string, userId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw ApiError.notFound('Order not found');
    if (order.userId !== userId) throw ApiError.forbidden('Unauthorized access');

    const capture = await capturePayPalOrder(paypalOrderId);

    if (capture.status === 'COMPLETED') {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: 'COMPLETED',
            status: 'CONFIRMED',
          },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId,
            fromStatus: order.status,
            toStatus: 'CONFIRMED',
            note: `Payment completed successfully via PayPal. ID: ${capture.transactionId}`,
          },
        });

        const payment = await tx.payment.findFirst({
          where: { orderId, provider: 'PAYPAL' },
          orderBy: { createdAt: 'desc' },
        });

        if (payment) {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'COMPLETED',
              transactionId: capture.transactionId,
              paidAt: new Date(),
            },
          });
        }
      });
    } else {
      throw ApiError.badRequest('PayPal transaction was not completed successfully');
    }

    return this.repo.findPaymentByOrderId(orderId);
  }

  // ─── Wallet Payments ─────────────────────────────────────────

  async processWalletPayment(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw ApiError.notFound('Order not found');
    if (order.userId !== userId) throw ApiError.forbidden('Unauthorized access');
    if (order.paymentStatus === 'COMPLETED') throw ApiError.badRequest('Order is already paid');

    let wallet = await this.repo.getWalletByUserId(userId);
    if (!wallet) {
      wallet = await this.repo.createWallet(userId);
    }

    const orderAmount = Number(order.totalAmount);
    if (Number(wallet.balance) < orderAmount) {
      throw ApiError.badRequest('Insufficient wallet balance');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Deduct from wallet balance
      const newBalance = Number(wallet.balance) - orderAmount;
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      // 2. Record wallet transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.DEBIT,
          amount: orderAmount,
          description: `Payment for order #${order.orderNumber}`,
          referenceId: orderId,
          referenceType: 'CUSTOMER_ORDER',
          balance: newBalance,
        },
      });

      // 3. Update order payment status
      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'COMPLETED',
          status: 'CONFIRMED',
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: 'CONFIRMED',
          note: 'Payment completed successfully via Wallet balance deduction',
        },
      });

      // 4. Save Payment record
      await tx.payment.create({
        data: {
          orderId,
          provider: 'WALLET',
          transactionId: transaction.id,
          amount: orderAmount,
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      });

      return transaction;
    });
  }

  async getWalletTransactions(userId: string, query: any) {
    let wallet = await this.repo.getWalletByUserId(userId);
    if (!wallet) {
      wallet = await this.repo.createWallet(userId);
    }

    const { transactions, total } = await this.repo.getWalletTransactions(wallet.id, query);
    return {
      balance: Number(wallet.balance),
      transactions,
      meta: buildPaginationMeta(total, query.page || 1, query.limit || 10),
    };
  }

  async topUpWallet(userId: string, amount: number) {
    let wallet = await this.repo.getWalletByUserId(userId);
    if (!wallet) {
      wallet = await this.repo.createWallet(userId);
    }

    const appUrl = env.NEXT_PUBLIC_APP_URL;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'NexaStore Wallet Top-up',
              description: `$${amount} loaded into wallet`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        amount: String(amount),
        type: 'WALLET_TOPUP',
      },
      success_url: `${appUrl}/dashboard/wallet?topup=success`,
      cancel_url: `${appUrl}/dashboard/wallet?topup=cancel`,
    });

    return { sessionUrl: session.url || '' };
  }
}
