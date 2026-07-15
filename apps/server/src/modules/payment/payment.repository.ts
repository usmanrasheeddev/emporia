// ═══════════════════════════════════════════════════════════════
// Payment Database Repository
// Direct access layer for Stripe/PayPal sessions and user wallets
// ═══════════════════════════════════════════════════════════════

import { prisma } from '../../config/database';
import { Payment, Wallet, WalletTransaction } from '@prisma/client';
import { PaymentStatus, PaymentProvider, WalletTransactionType } from '@nexastore/shared';

export class PaymentRepository {
  async createPayment(data: {
    orderId: string;
    provider: PaymentProvider;
    transactionId?: string | null;
    amount: number;
    currency?: string;
    status: PaymentStatus;
    metadata?: any;
  }): Promise<Payment> {
    return prisma.payment.create({
      data: data as any,
    });
  }

  async findPaymentByOrderId(orderId: string): Promise<Payment | null> {
    return prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPaymentByTransactionId(transactionId: string): Promise<Payment | null> {
    return prisma.payment.findFirst({
      where: { transactionId },
    });
  }

  async updatePaymentStatus(id: string, status: PaymentStatus, transactionId?: string, paidAt?: Date): Promise<Payment> {
    return prisma.payment.update({
      where: { id },
      data: { status: status as any, transactionId, paidAt },
    });
  }

  // ─── Wallet Operations ───────────────────────────────────────

  async getWalletByUserId(userId: string): Promise<Wallet | null> {
    return prisma.wallet.findUnique({
      where: { userId },
    });
  }

  async createWallet(userId: string): Promise<Wallet> {
    return prisma.wallet.create({
      data: { userId, balance: 0 },
    });
  }

  async updateWalletBalance(walletId: string, balance: number): Promise<Wallet> {
    return prisma.wallet.update({
      where: { id: walletId },
      data: { balance },
    });
  }

  async createWalletTransaction(data: {
    walletId: string;
    type: WalletTransactionType;
    amount: number;
    description: string;
    referenceId?: string | null;
    referenceType?: string | null;
    balance: number;
  }): Promise<WalletTransaction> {
    return prisma.walletTransaction.create({
      data: data as any,
    });
  }

  async getWalletTransactions(walletId: string, query: any) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { walletId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.walletTransaction.count({ where: { walletId } }),
    ]);

    return { transactions, total };
  }
}
