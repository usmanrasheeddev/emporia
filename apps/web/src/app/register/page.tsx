// ═══════════════════════════════════════════════════════════════
// Register Page
// Customer account registration form
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Card } from '@/components/ui/Card/Card';
import { Alert } from '@/components/ui/Alert/Alert';
import styles from './register.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await register({
        firstName,
        lastName,
        email,
        password,
        phone: phone || undefined,
      });

      setSuccess('Account created successfully! Redirecting to verify OTP...');
      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <Card className={styles.registerCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Get started with your NexaStore account</p>
        </div>

        {error && (
          <Alert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && <Alert variant="success">{success}</Alert>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.nameRow}>
            <Input
              id="firstName"
              type="text"
              label="First Name"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              disabled={isLoading}
            />
            <Input
              id="lastName"
              type="text"
              label="Last Name"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Input
            id="email"
            type="email"
            label="Email Address"
            placeholder="john.doe@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />

          <Input
            id="phone"
            type="tel"
            label="Phone Number (Optional)"
            placeholder="+1 555-0199"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isLoading}
          />

          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            hint="Min. 8 chars, uppercase, lowercase, digit, and special char."
          />

          <Button type="submit" variant="primary" fullWidth loading={isLoading}>
            Create Account
          </Button>
        </form>

        <div className={styles.footer}>
          Already have an account?{' '}
          <Link href="/login" className={styles.loginLink}>
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
}
