// ═══════════════════════════════════════════════════════════════
// Stripe Payment Configuration
// ═══════════════════════════════════════════════════════════════

import Stripe from 'stripe';
import { env } from './env';

const stripeKey = env.STRIPE_SECRET_KEY || 'sk_test_dummy_secret_key_please_replace_in_production';

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-12-18.acacia' as any,
  typescript: true,
});

export { Stripe };
