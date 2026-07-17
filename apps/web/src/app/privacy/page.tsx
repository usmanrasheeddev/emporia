// ═══════════════════════════════════════════════════════════════
// Privacy Policy Page
// Static corporate privacy policy layout
// ═══════════════════════════════════════════════════════════════

import React from 'react';

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 16px', color: 'var(--color-text)' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', letterSpacing: '-0.02em' }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
        Last updated: July 17, 2026
      </p>

      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '12px' }}>1. Data Collection</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
          We collect personal identification information including your email, name, shipping addresses, and purchase history ledger to facilitate shopping and secure user sessions.
        </p>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '12px' }}>2. Data Usage</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
          Your data is used to process checkout orders, manage support requests, track wallet transactions, and enhance account security with Two-Factor Authentication (2FA).
        </p>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '12px' }}>3. Third-Party Integrations</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
          We share necessary billing indicators with secure payment processors (Stripe and PayPal) and media delivery endpoints (Cloudinary) to execute normal store functionalities.
        </p>
      </section>

      <section style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'semibold', marginBottom: '12px' }}>4. Your Rights</h2>
        <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>
          You have the right to request deletion of your account records or address details at any time through our customer support desk or profile dashboard.
        </p>
      </section>
    </div>
  );
}
