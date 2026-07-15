// ═══════════════════════════════════════════════════════════════
// Customer Dashboard Layout
// Clean sidebar navigation and responsive account workspace
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import styles from './layout.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(pathname));
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className={styles.loaderWrapper}>
        <span className={styles.loadingText}>Verifying session...</span>
      </div>
    );
  }

  const menuItems = [
    { label: 'Overview', href: '/dashboard' },
    { label: 'Order History', href: '/dashboard/orders' },
    { label: 'Addresses', href: '/dashboard/addresses' },
    { label: 'Wallet & Top-up', href: '/dashboard/wallet' },
    { label: 'Support Tickets', href: '/dashboard/tickets' },
    { label: 'Account Settings', href: '/dashboard/profile' },
  ];

  return (
    <div className={`${styles.dashboardContainer} container`}>
      {/* Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <nav className={styles.nav} aria-label="Dashboard navigation">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.activeLink : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content Workspace */}
      <main className={styles.content}>{children}</main>
    </div>
  );
}
