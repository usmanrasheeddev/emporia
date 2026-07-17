// ═══════════════════════════════════════════════════════════════
// Terms of Service Page
// Static corporate terms layout
// ═══════════════════════════════════════════════════════════════

import React from 'react';

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 16px', color: 'var(--color-text)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', letterSpacing: '-0.02em' }}>
        Terms of Service
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
        Last updated: July 17, 2026
      </p>

      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '12px' }}>1. Introduction</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
          Welcome to NexaStore. By using our website and services, you agree to comply with and be bound by the following terms of service. Please review them carefully.
        </p>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '12px' }}>2. Account Responsibilities</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
          You are responsible for maintaining the confidentiality of your account credentials, including passwords and active authentication sessions. You agree to notify us immediately of any unauthorized use of your account.
        </p>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '12px' }}>3. Purchases & Wallet Balances</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
          All purchases made through our store are subject to product availability. Wallet top-up credits are powered securely by Stripe and PayPal checkout and are strictly non-refundable except where required by local law.
        </p>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '12px' }}>4. Limitation of Liability</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
          NexaStore shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our services or products.
        </p>
      </section>
    </div>
  );
}
