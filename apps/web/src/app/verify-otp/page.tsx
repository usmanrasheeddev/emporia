// ═══════════════════════════════════════════════════════════════
// Verify OTP Page
// 6-digit OTP code confirmation form
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Card } from '@/components/ui/Card/Card';
import { Alert } from '@/components/ui/Alert/Alert';
import styles from './verify-otp.module.css';

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      setSuccess('Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess('A new verification OTP code has been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={styles.verifyCard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Verify Email</h1>
        <p className={styles.subtitle}>Enter the 6-digit code sent to {email || 'your email'}</p>
      </div>

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && <Alert variant="success">{success}</Alert>}

      <form onSubmit={handleSubmit} className={styles.form}>
        {!emailParam && (
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
        )}

        <Input
          id="otp"
          type="text"
          label="Verification Code"
          placeholder="123456"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          required
          disabled={isLoading}
        />

        <Button type="submit" variant="primary" fullWidth loading={isLoading}>
          Verify Code
        </Button>
      </form>

      <div className={styles.resendWrapper}>
        Didn&apos;t receive a code?{' '}
        <button onClick={handleResend} className={styles.resendButton} disabled={isLoading || !email}>
          Resend Code
        </button>
      </div>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className={styles.pageWrapper}>
      <Suspense fallback={<div>Loading form...</div>}>
        <VerifyOtpForm />
      </Suspense>
    </div>
  );
}
