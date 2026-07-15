// ═══════════════════════════════════════════════════════════════
// PayPal Payment Configuration
// ═══════════════════════════════════════════════════════════════

import { env } from './env';
import { logger } from '../utils/logger';

const PAYPAL_BASE_URL =
  env.PAYPAL_MODE === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

/** Get PayPal OAuth2 access token */
async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error('PayPal auth failed:', error);
    throw new Error('Failed to get PayPal access token');
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

/** Create a PayPal order */
export async function createPayPalOrder(
  amount: number,
  currency = 'USD',
  description = 'NexaStore Order'
): Promise<{ id: string; approvalUrl: string }> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
          description,
        },
      ],
      application_context: {
        return_url: `${env.CORS_ORIGIN}/checkout/success`,
        cancel_url: `${env.CORS_ORIGIN}/checkout/cancel`,
        brand_name: 'NexaStore',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error('PayPal create order failed:', error);
    throw new Error('Failed to create PayPal order');
  }

  const data = (await response.json()) as {
    id: string;
    links: Array<{ rel: string; href: string }>;
  };

  const approvalLink = data.links.find((l) => l.rel === 'approve');
  return {
    id: data.id,
    approvalUrl: approvalLink?.href || '',
  };
}

/** Capture (finalize) a PayPal order after user approval */
export async function capturePayPalOrder(
  orderId: string
): Promise<{ transactionId: string; status: string; amount: number }> {
  const accessToken = await getPayPalAccessToken();

  const response = await fetch(
    `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    logger.error('PayPal capture failed:', error);
    throw new Error('Failed to capture PayPal order');
  }

  const data = (await response.json()) as any;
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];

  return {
    transactionId: capture?.id || orderId,
    status: data.status,
    amount: parseFloat(capture?.amount?.value || '0'),
  };
}

/** Refund a PayPal payment */
export async function refundPayPalPayment(
  captureId: string,
  amount?: number,
  currency = 'USD'
): Promise<{ refundId: string; status: string }> {
  const accessToken = await getPayPalAccessToken();

  const body: any = {};
  if (amount) {
    body.amount = { currency_code: currency, value: amount.toFixed(2) };
  }

  const response = await fetch(
    `${PAYPAL_BASE_URL}/v2/payments/captures/${captureId}/refund`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    logger.error('PayPal refund failed:', error);
    throw new Error('Failed to refund PayPal payment');
  }

  const data = (await response.json()) as { id: string; status: string };
  return { refundId: data.id, status: data.status };
}
