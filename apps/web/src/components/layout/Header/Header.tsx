// ═══════════════════════════════════════════════════════════════
// Global Layout Header
// Displays branding, responsive navigation, search bar, and cart badges
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { SearchBar } from '@/components/ui/SearchBar/SearchBar';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  const router = useRouter();
  const { user, logout, loadFromStorage, isAuthenticated } = useAuthStore();
  const { itemCount, fetchCart } = useCartStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Initial load
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    fetchCart().catch(() => {});
  }, [fetchCart]);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className={styles.header}>
      <div className={`${styles.container} container`}>
        {/* Logo */}
        <Link href="/" className={styles.logo} aria-label="NexaStore Home">
          NexaStore
        </Link>

        {/* Search Bar */}
        <div className={styles.searchBar}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleSearchSubmit}
            onClear={() => setSearchQuery('')}
            placeholder="Search products, brands, categories..."
          />
        </div>

        {/* Navigation Links */}
        <nav className={styles.nav} aria-label="Main Navigation">
          <Link href="/products" className={styles.navLink}>
            Shop
          </Link>
          <Link href="/categories" className={styles.navLink}>
            Categories
          </Link>
        </nav>

        {/* User Actions */}
        <div className={styles.actions}>
          <Link href="/cart" className={styles.cartLink} aria-label="Shopping Cart">
            <span className={styles.cartIcon}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="20"
                height="20"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </span>
            {itemCount > 0 && <span className={styles.badge}>{itemCount}</span>}
          </Link>

          {isAuthenticated && user ? (
            <div className={styles.userProfile}>
              {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                <Link href="/admin" style={{ marginRight: '16px', fontSize: '14px', textDecoration: 'none', color: 'var(--color-primary)', fontWeight: 500 }}>
                  Admin Portal
                </Link>
              )}
              <Link href="/dashboard" aria-label="User Dashboard">
                <Avatar
                  fallback={`${(user?.firstName || '')[0] || ''}${(user?.lastName || '')[0] || ''}`}
                  size="sm"
                />
              </Link>
              <button onClick={logout} className={styles.logoutButton}>
                Logout
              </button>
            </div>
          ) : (
            <div className={styles.authButtons} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link href="/login" className={styles.loginLink}>
                Login
              </Link>
              <Link href="/register" className={styles.loginLink} style={{ backgroundColor: 'var(--color-primary, #000)', color: '#fff', padding: '6px 14px', borderRadius: '6px', textDecoration: 'none' }}>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
