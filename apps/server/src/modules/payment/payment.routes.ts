// ═══════════════════════════════════════════════════════════════
// Payment & Wallet Routes
// Checkout integrations and wallet balance transaction logs
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import {
  createStripeSessionSchema,
  createPayPalSessionSchema,
  verifyPayPalOrderSchema,
  walletPaymentSchema,
  walletTopUpSchema,
} from './payment.validator';

const router = Router();

// Webhook endpoint (Requires raw body, handled by the controller via verify payload)
router.post('/webhook', PaymentController.stripeWebhook);

// Apply authentication to other payment endpoints
router.use(authenticate);

// Stripe Checkout
router.post('/stripe/session', validate(createStripeSessionSchema), PaymentController.createStripeSession);

// PayPal Checkout
router.post('/paypal/session', validate(createPayPalSessionSchema), PaymentController.createPayPalSession);
router.post('/paypal/verify', validate(verifyPayPalOrderSchema), PaymentController.verifyPayPalPayment);

// Wallet Operations
router.post('/wallet', validate(walletPaymentSchema), PaymentController.processWalletPayment);
router.get('/wallet', PaymentController.getWalletTransactions);
router.post('/wallet/topup', validate(walletTopUpSchema), PaymentController.topUpWallet);

export default router;
//
