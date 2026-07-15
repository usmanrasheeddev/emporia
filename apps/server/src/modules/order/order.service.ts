// ═══════════════════════════════════════════════════════════════
// Order Service Layer
// Orchestrates checkout creations, stock deductions, state machines, and cancellations
// ═══════════════════════════════════════════════════════════════

import { OrderRepository } from './order.repository';
import { ApiError } from '../../utils/api-error';
import { prisma } from '../../config/database';
import { buildPaginationMeta } from '../../utils/pagination';
import { sendEmail } from '../../config/mailer';
import { generateOrderNumber, generateInvoiceNumber } from '../../utils/helpers';
import { OrderStatus, PaymentStatus, ORDER_TRANSITIONS, InventoryLogType } from '@nexastore/shared';

export class OrderService {
  private repo: OrderRepository;

  constructor(repo: OrderRepository) {
    this.repo = repo;
  }

  /**
   * Executes order checkout inside a strict database transaction,
   * managing stock deductions, invoice creation, and clearing cart.
   */
  async createOrder(userId: string, data: any) {
    const { addressId, paymentMethod, shippingMethodId, notes } = data;

    // 1. Fetch Cart details
    const { CartService } = require('../cart/cart.service');
    const { CartRepository } = require('../cart/cart.repository');
    const cartService = new CartService(new CartRepository());

    const cart = await cartService.getOrCreateCart(userId);
    if (cart.items.length === 0) {
      throw ApiError.badRequest('Cannot place an order with an empty cart');
    }

    // 2. Validate Address
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw ApiError.notFound('Shipping address not found');

    // 3. Validate Shipping Method & calculate rates
    const shippingMethod = await prisma.shippingMethod.findUnique({ where: { id: shippingMethodId } });
    if (!shippingMethod || !shippingMethod.isActive) {
      throw ApiError.badRequest('Invalid or inactive shipping method');
    }

    const { ShippingService } = require('../shipping/shipping.service');
    const { ShippingRepository } = require('../shipping/shipping.repository');
    const shippingService = new ShippingService(new ShippingRepository());
    const estimation = await shippingService.calculateShippingAndTax(userId, {
      addressId,
      subtotal: cart.subtotal,
    });

    const selectedShippingOption = estimation.shippingOptions.find((o: any) => o.id === shippingMethodId);
    const shippingAmount = selectedShippingOption ? selectedShippingOption.rate : Number(shippingMethod.baseRate);
    const taxAmount = estimation.tax.amount;

    // 4. Calculate Final Total
    const subtotal = cart.subtotal;
    const discountAmount = cart.discountAmount;
    const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount + shippingAmount);

    const orderNumber = generateOrderNumber();
    const invoiceNumber = generateInvoiceNumber();

    // 5. Place order inside transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId,
          status: 'PENDING',
          subtotal,
          taxAmount,
          shippingAmount,
          discountAmount,
          totalAmount,
          paymentMethod,
          paymentStatus: 'PENDING',
          notes,
          couponId: cart.coupon ? (await tx.coupon.findUnique({ where: { code: cart.coupon.code } }))?.id : null,
          couponCode: cart.coupon?.code || null,
        },
      });

      // Create Order Items and Deduct Stock
      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            variantId: item.variantId,
            name: item.productName,
            sku: item.sku,
            image: item.image,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
          },
        });

        // Stock Deduction: Find a warehouse with matching stock
        const stockItems = await tx.inventoryItem.findMany({
          where: { variantId: item.variantId, quantity: { gte: item.quantity } },
          orderBy: { quantity: 'desc' },
          take: 1,
        });

        if (stockItems.length === 0) {
          throw ApiError.badRequest(
            `Insufficient stock for item "${item.productName}" (${item.variantName || 'Default'})`
          );
        }

        const stock = stockItems[0];
        const updatedStock = await tx.inventoryItem.update({
          where: { id: stock.id },
          data: { quantity: { decrement: item.quantity } },
        });

        // Write inventory deduction log
        await tx.inventoryLog.create({
          data: {
            variantId: item.variantId,
            warehouseId: stock.warehouseId,
            type: InventoryLogType.STOCK_OUT,
            quantity: item.quantity,
            previousQuantity: stock.quantity,
            newQuantity: updatedStock.quantity,
            reference: 'CUSTOMER_ORDER',
            referenceId: newOrder.id,
            notes: `Stock deducted for order #${orderNumber}`,
          },
        });

        // Update overall variant cached stock totals
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Create Invoice
      await tx.invoice.create({
        data: {
          orderId: newOrder.id,
          invoiceNumber,
          subtotal,
          taxAmount,
          shippingAmount,
          discountAmount,
          totalAmount,
        },
      });

      // Create initial order history
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          toStatus: 'PENDING',
          note: 'Order placed by customer',
        },
      });

      // Increment coupon usage
      if (cart.coupon) {
        await tx.coupon.update({
          where: { code: cart.coupon.code },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Clear Cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    // 6. Send Order Confirmation Email
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      await sendEmail({
        to: user.email,
        subject: `Order Confirmation #${orderNumber}`,
        template: 'order-confirmation',
        data: {
          orderNumber,
          items: cart.items,
          subtotal: subtotal.toFixed(2),
          discount: discountAmount.toFixed(2),
          tax: taxAmount.toFixed(2),
          shipping: shippingAmount.toFixed(2),
          total: totalAmount.toFixed(2),
          appUrl,
          supportEmail: 'support@nexastore.com',
        },
      });
    }

    return this.repo.findById(order.id);
  }

  async getOrderById(id: string, userId: string, isAdmin = false) {
    const order = await this.repo.findById(id);
    if (!order) throw ApiError.notFound('Order not found');

    if (order.userId !== userId && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to view this order');
    }

    return order;
  }

  async getMyOrders(userId: string, query: any) {
    const { orders, total } = await this.repo.findByUserId(userId, query);
    return {
      orders,
      meta: buildPaginationMeta(total, query.page || 1, query.limit || 10),
    };
  }

  async getAllOrders(query: any) {
    const { orders, total } = await this.repo.findAll(query);
    return {
      orders,
      meta: buildPaginationMeta(total, query.page || 1, query.limit || 20),
    };
  }

  /**
   * Enforces order state machine and transitions orders.
   * Restores stock back to warehouse if status is CANCELLED.
   */
  async updateStatus(id: string, status: OrderStatus, changedById?: string, note?: string) {
    const order = await this.repo.findById(id);
    if (!order) throw ApiError.notFound('Order not found');

    // Enforce State Machine Transitions
    const allowed = ORDER_TRANSITIONS[order.status as OrderStatus];
    if (!allowed || !allowed.includes(status)) {
      throw ApiError.badRequest(
        `Invalid status transition from ${order.status} to ${status}`
      );
    }

    // Process status updates inside a transaction
    return prisma.$transaction(async (tx) => {
      // ─── Return stock to warehouse on cancellation ───────────
      if (status === 'CANCELLED') {
        const orderItems = await tx.orderItem.findMany({ where: { orderId: id } });

        for (const item of orderItems) {
          if (item.variantId) {
            // Find first warehouse to return stock (or default manager choice)
            const inventory = await tx.inventoryItem.findFirst({
              where: { variantId: item.variantId },
            });

            if (inventory) {
              const updatedStock = await tx.inventoryItem.update({
                where: { id: inventory.id },
                data: { quantity: { increment: item.quantity } },
              });

              // Log stock return
              await tx.inventoryLog.create({
                data: {
                  variantId: item.variantId,
                  warehouseId: inventory.warehouseId,
                  type: InventoryLogType.RETURN,
                  quantity: item.quantity,
                  previousQuantity: inventory.quantity,
                  newQuantity: updatedStock.quantity,
                  reference: 'ORDER_CANCEL',
                  referenceId: id,
                  notes: `Stock returned from cancelled order #${order.orderNumber}`,
                  createdById: changedById,
                },
              });

              // Update overall variant cached stock totals
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } },
              });
            }
          }
        }

        // Refund usage limit on coupon if order cancelled
        if (order.couponCode) {
          await tx.coupon.update({
            where: { code: order.couponCode },
            data: { usedCount: { decrement: 1 } },
          });
        }
      }

      // Update order status and log history
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status,
          deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
          cancelledAt: status === 'CANCELLED' ? new Date() : undefined,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.status as OrderStatus,
          toStatus: status,
          note,
          changedById,
        },
      });

      return tx.order.findUnique({
        where: { id },
        include: {
          items: true,
          address: true,
          invoice: true,
          statusHistory: { orderBy: { createdAt: 'desc' }, include: { changedBy: { select: { firstName: true, lastName: true } } } },
        },
      });
    });
  }
}
