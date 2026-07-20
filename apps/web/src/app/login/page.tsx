// ═══════════════════════════════════════════════════════════════
// Login Page
// Clean credentials form and oauth login links with Suspense boundary
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Card } from '@/components/ui/Card/Card';
import { Alert } from '@/components/ui/Alert/Alert';
import styles from './login.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading, loadFromStorage } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Ingest OAuth token from URL parameters if redirected back
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('auth_token', token);
      loadFromStorage();
    }
  }, [searchParams, loadFromStorage]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
    }
  }, [isAuthenticated, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <Card className={styles.loginCard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to your NexaStore account</p>
      </div>

      {error && (
        <Alert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          id="email"
          type="email"
          label="Email Address"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />

        <div className={styles.passwordField}>
          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <Link href="/forgot-password" className={styles.forgotPasswordLink}>
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" fullWidth loading={isLoading}>
          Sign In
        </Button>
      </form>

      <div className={styles.divider}>
        <span className={styles.dividerText}>or continue with</span>
      </div>

      <div className={styles.oauthContainer}>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL || 'https://nexastoreserver-production.up.railway.app/api/v1'}/auth/google`}
          className={styles.oauthButton}
        >
          Google
        </a>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL || 'https://nexastoreserver-production.up.railway.app/api/v1'}/auth/github`}
          className={styles.oauthButton}
        >
          GitHub
        </a>
      </div>

      <div className={styles.footer}>
        Don&apos;t have an account?{' '}
        <Link href="/register" className={styles.registerLink}>
          Create one
        </Link>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className={styles.pageWrapper}>
      <Suspense fallback={<Card className={styles.loginCard}>Loading auth console...</Card>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
