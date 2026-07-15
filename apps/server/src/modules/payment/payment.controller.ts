// ═══════════════════════════════════════════════════════════════
// Payment Controller Layer
// Maps HTTP endpoints to Stripe, PayPal, and Wallet payment services
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { RequestWithUser } from '../../types';

const service = new PaymentService(new PaymentRepository());

export class PaymentController {
  static createStripeSession = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const userId = req.user!.id;
    const { orderId } = req.body;
    const result = await service.processStripePayment(orderId, userId);
    res.json(ApiResponse.success('Stripe checkout session initialized', result));
  });

  static stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    await service.handleStripeWebhook(signature, req.body);
    res.status(200).json({ received: true });
  });

  static createPayPalSession = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const userId = req.user!.id;
    const { orderId } = req.body;
    const result = await service.processPayPalPayment(orderId, userId);
    res.json(ApiResponse.success('PayPal checkout session initialized', result));
  });

  static verifyPayPalPayment = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const userId = req.user!.id;
    const { orderId, paypalOrderId } = req.body;
    const payment = await service.verifyPayPalPayment(orderId, paypalOrderId, userId);
    res.json(ApiResponse.success('PayPal payment captured successfully', payment));
  });

  static processWalletPayment = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const userId = req.user!.id;
    const { orderId } = req.body;
    const transaction = await service.processWalletPayment(orderId, userId);
    res.json(ApiResponse.success('Payment completed successfully via Wallet balance', transaction));
  });

  static getWalletTransactions = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const userId = req.user!.id;
    const result = await service.getWalletTransactions(userId, req.query);
    res.json(ApiResponse.success('Wallet details and ledger retrieved successfully', result));
  });

  static topUpWallet = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const userId = req.user!.id;
    const { amount } = req.body;
    const result = await service.topUpWallet(userId, amount);
    res.json(ApiResponse.success('Wallet top-up checkout session initialized', result));
  });
}
