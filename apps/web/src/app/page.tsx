// ═══════════════════════════════════════════════════════════════
// Landing & Homepage (Shop)
// Displays static banners, featured categories, and featured products
// ═══════════════════════════════════════════════════════════════

// Production deployment trigger v2 - all auth fixes applied
'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { useCartStore } from '@/stores/cart.store';
import styles from './home.module.css';

export default function HomePage() {
  const { addToCart } = useCartStore();

  // Fetch featured categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories-featured'],
    queryFn: () => api.get<any>('/categories/tree'),
  });

  // Fetch featured products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products-featured'],
    queryFn: () => api.get<any>('/products?isFeatured=true&limit=8'),
  });

  const featuredCategories = categoriesData?.data?.slice(0, 6) || [];
  const featuredProducts = productsData?.data || [];

  return (
    <div className={styles.home}>
      {/* ─── Hero Section ──────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Summer Collection 2026</span>
          <h1 className={styles.heroTitle}>Essential Products, Built for Utility</h1>
          <p className={styles.heroSubtitle}>
            A carefully curated selection of premium electronics and apparel. Simple. Predictable. Functional.
          </p>
          <div className={styles.heroActions}>
            <Link href="/products">
              <Button variant="primary" size="lg">
                Browse Shop
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Categories Section ────────────────────────────────── */}
      <section className={`${styles.section} container`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Shop by Category</h2>
          <p className={styles.sectionSubtitle}>Find high-quality products in your favorite categories</p>
        </div>

        {categoriesLoading ? (
          <div className={styles.loaderWrapper}>
            <Spinner />
          </div>
        ) : (
          <div className={styles.categoriesGrid}>
            {featuredCategories.map((category: any) => (
              <Link key={category.id} href={`/products?category=${category.slug}`} className={styles.categoryCardLink}>
                <Card className={styles.categoryCard} padding="md">
                  <h3 className={styles.categoryName}>{category.name}</h3>
                  <span className={styles.categoryCount}>{category.productCount || 0} Products</span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ─── Featured Products Section ─────────────────────────── */}
      <section className={`${styles.section} ${styles.grayBg}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Featured Products</h2>
            <p className={styles.sectionSubtitle}>Our highly recommended products for this season</p>
          </div>

          {productsLoading ? (
            <div className={styles.loaderWrapper}>
              <Spinner />
            </div>
          ) : (
            <div className={styles.productsGrid}>
              {featuredProducts.map((product: any) => {
                const primaryImage = product.images?.[0]?.url || 'https://placehold.co/300x300/e5e7eb/111827?text=Product';
                const defaultVariant = product.variants?.[0];
                const price = defaultVariant ? Number(defaultVariant.price) : Number(product.basePrice);

                return (
                  <Card key={product.id} className={styles.productCard} padding="none">
                    <Link href={`/products/${product.slug}`} className={styles.productImageLink}>
                      <img src={primaryImage} alt={product.name} className={styles.productImage} />
                    </Link>
                    <div className={styles.productInfo}>
                      <span className={styles.productCategory}>{product.category?.name}</span>
                      <Link href={`/products/${product.slug}`} className={styles.productNameLink}>
                        <h3 className={styles.productName}>{product.name}</h3>
                      </Link>
                      <div className={styles.productRating}>
                        <span className={styles.stars}>★</span>
                        <span className={styles.ratingValue}>{Number(product.avgRating).toFixed(1)}</span>
                        <span className={styles.reviewsCount}>({product.totalReviews})</span>
                      </div>
                      <div className={styles.productFooter}>
                        <span className={styles.productPrice}>${price.toFixed(2)}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addToCart(product.id, defaultVariant?.id, 1)}
                          disabled={!defaultVariant || defaultVariant.stock === 0}
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── Features Strip ────────────────────────────────────── */}
      <section className={`${styles.featuresStrip} container`}>
        <div className={styles.featureItem}>
          <h4 className={styles.featureTitle}>Free Shipping</h4>
          <p className={styles.featureDesc}>On orders over $150.00 standard deliveries.</p>
        </div>
        <div className={styles.featureItem}>
          <h4 className={styles.featureTitle}>Secure Payments</h4>
          <p className={styles.featureDesc}>Stripe, PayPal, and account wallet support.</p>
        </div>
        <div className={styles.featureItem}>
          <h4 className={styles.featureTitle}>Expert Support</h4>
          <p className={styles.featureDesc}>Professional helpdesk for all customers.</p>
        </div>
      </section>
    </div>
  );
}
