// ═══════════════════════════════════════════════════════════════
// Order Database Repository
// Direct access layer for orders, history, and invoices
// ═══════════════════════════════════════════════════════════════

import { prisma } from '../../config/database';
import { Order, OrderStatus, Prisma } from '@prisma/client';

const ORDER_INCLUDE = {
  items: {
    include: {
      product: { select: { name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } },
      variant: { select: { name: true, sku: true } },
    },
  },
  address: true,
  invoice: true,
  statusHistory: { orderBy: { createdAt: 'desc' as const }, include: { changedBy: { select: { firstName: true, lastName: true } } } },
};

export class OrderRepository {
  async findById(id: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: ORDER_INCLUDE,
    });
  }

  async findByUserId(userId: string, query: any): Promise<{ orders: Order[]; total: number }> {
    const { page = 1, limit = 10, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: ORDER_INCLUDE,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  async findAll(query: any): Promise<{ orders: Order[]; total: number }> {
    const { page = 1, limit = 20, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          invoice: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  async updateStatus(id: string, status: OrderStatus, changedById?: string, note?: string): Promise<Order> {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id } });
      if (!order) throw new Error('Order not found');

      // Update Order Status
      const updated = await tx.order.update({
        where: { id },
        data: {
          status,
          deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
          cancelledAt: status === 'CANCELLED' ? new Date() : undefined,
        },
        include: ORDER_INCLUDE,
      });

      // Write to History Log
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.status,
          toStatus: status,
          note,
          changedById,
        },
      });

      return updated;
    });
  }

  async getStatusHistory(orderId: string) {
    return prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: { changedBy: { select: { firstName: true, lastName: true } } },
    });
  }
}
