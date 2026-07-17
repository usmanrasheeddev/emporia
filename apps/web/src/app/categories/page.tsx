// ═══════════════════════════════════════════════════════════════
// Categories Listing Page
// Displays all catalog departments and collections
// ═══════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card/Card';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import styles from './categories.module.css';

export default function CategoriesPage() {
  // Fetch active categories
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['categories-catalog'],
    queryFn: () => api.get<any>('/categories'),
  });

  const categories = response?.data || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>All Categories</h1>
        <p className={styles.subtitle}>Browse our collection departments and specialty stores</p>
      </div>

      {isLoading ? (
        <div className={styles.loaderWrapper}>
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <p className={styles.errorMsg}>Failed to load categories. Please try refreshing.</p>
      ) : categories.length === 0 ? (
        <p className={styles.subtitle}>No departments available at this time.</p>
      ) : (
        <div className={styles.grid}>
          {categories.map((category: any) => (
            <Card key={category.id} padding="none" className={styles.categoryCard}>
              <h2 className={styles.categoryName}>{category.name}</h2>
              <p className={styles.categoryDesc}>
                {category.description || 'Quality selections matching your lifestyle and preferences.'}
              </p>
              <Link href={`/search?category=${category.slug}`} className={styles.categoryLink}>
                Explore Products &rarr;
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
