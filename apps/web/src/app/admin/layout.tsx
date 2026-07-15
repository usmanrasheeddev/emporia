// ═══════════════════════════════════════════════════════════════
// Admin Panel Layout
// Coordinates sidebar navigation lists, role authorization, and sub-workspaces
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import styles from './layout.module.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=' + encodeURIComponent(pathname));
      } else if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, pathname, router]);

  if (isLoading || !isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
    return (
      <div className={styles.loaderWrapper}>
        <span className={styles.loadingText}>Verifying administrator privileges...</span>
      </div>
    );
  }

  const menuItems = [
    { label: 'Analytics overview', href: '/admin' },
    { label: 'Manage Products', href: '/admin/products' },
    { label: 'Inventory & Stock', href: '/admin/inventory' },
    { label: 'All Customer Orders', href: '/admin/orders' },
    { label: 'Support Desk Tickets', href: '/admin/tickets' },
  ];

  return (
    <div className={`${styles.adminContainer} container`}>
      {/* Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <strong className={styles.adminLabel}>Store Console</strong>
          <span className={styles.adminRole}>Signed as {user.role}</span>
        </div>
        <nav className={styles.nav} aria-label="Admin console navigation">
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
