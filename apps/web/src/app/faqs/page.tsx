// ═══════════════════════════════════════════════════════════════
// Frequently Asked Questions (FAQ) Page
// Static corporate FAQ accordion layout
// ═══════════════════════════════════════════════════════════════

import React from 'react';

const faqItems = [
  {
    question: 'How do I top up my wallet balance?',
    answer: 'Navigate to your dashboard, click "Wallet & Top-up", enter the amount, and proceed to Stripe checkout. Your credits will be available immediately after successful checkout.',
  },
  {
    question: 'Are card payments secure on NexaStore?',
    answer: 'Yes. All payments are processed directly by Stripe and PayPal. We do not store or process card numbers on our server databases.',
  },
  {
    question: 'How do I open a customer support ticket?',
    answer: 'Go to your account dashboard, click "Support Tickets", and click "Open Support Ticket" to describe your issue. Our agents will respond to your chat thread directly.',
  },
  {
    question: 'What is the utility of the wallet?',
    answer: 'The wallet lets you pre-load credits so you can checkout instantly on products without entering billing info on every transaction.',
  },
  {
    question: 'How do I set up Two-Factor Authentication (2FA)?',
    answer: 'Visit your dashboard, click "Update Settings", and enable 2FA by scanning the authenticator barcode. This secures your session tokens.',
  },
];

export default function FAQsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 16px', color: 'var(--color-text)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', letterSpacing: '-0.02em' }}>
        Frequently Asked Questions
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
        Quick answers to common questions about checkout, wallet, and support tickets
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {faqItems.map((item, index) => (
          <div
            key={index}
            style={{
              padding: '20px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-bg)',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 'semibold', margin: '0 0 8px 0', color: 'var(--color-text)' }}>
              {item.question}
            </h3>
            <p style={{ fontSize: '14px', lineHeight: '1.5', margin: '0', color: 'var(--color-text-secondary)' }}>
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
