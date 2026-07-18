// ═══════════════════════════════════════════════════════════════
// Product Listing Directory
// Sidebar filters, search integration, sorting, and pagination
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Pagination } from '@/components/ui/Pagination/Pagination';
import { useCartStore } from '@/stores/cart.store';
import Link from 'next/link';
import styles from './products.module.css';

function ProductsCatalog() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCartStore();

  // ─── Filter States derived from URL ──────────────────────────
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sortBy = searchParams.get('sortBy') || 'relevance';
  const page = Number(searchParams.get('page') || '1');

  // Input states (for local filters editing)
  const [minInput, setMinInput] = useState(minPrice);
  const [maxInput, setMaxInput] = useState(maxPrice);
  const [inStock, setInStock] = useState(searchParams.get('inStock') === 'true');

  useEffect(() => {
    setMinInput(minPrice);
    setMaxInput(maxPrice);
    setInStock(searchParams.get('inStock') === 'true');
  }, [minPrice, maxPrice, searchParams]);

  // ─── Query Categories & Brands for filters ────────────────────
  const { data: categories } = useQuery({
    queryKey: ['categories-list'],
    queryFn: () => api.get<any>('/categories/tree'),
  });

  const { data: brands } = useQuery({
    queryKey: ['brands-list'],
    queryFn: () => api.get<any>('/brands?limit=50'),
  });

  // ─── Query Products Catalog ──────────────────────────────────
  const queryParams = new URLSearchParams();
  if (q) queryParams.set('q', q);
  if (category) queryParams.set('category', category);
  if (brand) queryParams.set('brand', brand);
  if (minPrice) queryParams.set('minPrice', minPrice);
  if (maxPrice) queryParams.set('maxPrice', maxPrice);
  if (inStock) queryParams.set('inStock', 'true');
  if (sortBy) queryParams.set('sortBy', sortBy);
  queryParams.set('page', String(page));
  queryParams.set('limit', '12');

  const { data: catalogData, isLoading } = useQuery({
    queryKey: ['products-catalog', queryParams.toString()],
    queryFn: () => api.get<any>(`/search?${queryParams.toString()}`),
  });

  const products = catalogData?.data?.products || [];
  const meta = catalogData?.meta || { page: 1, limit: 12, total: 0, totalPages: 1 };
  
  const categoryList = categories?.data || [];
  const brandList = brands?.data || [];

  // ─── Filter Actions ──────────────────────────────────────────
  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1'); // Reset page on filter update

    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === '') {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    router.push(`/products?${params.toString()}`);
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ minPrice: minInput, maxPrice: maxInput });
  };

  const handleReset = () => {
    setMinInput('');
    setMaxInput('');
    setInStock(false);
    router.push('/products');
  };

  return (
    <div className={`${styles.container} container`}>
      {/* ─── Sidebar Filters ────────────────────────────────────── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Filters</h2>
          <button onClick={handleReset} className={styles.resetButton}>
            Reset All
          </button>
        </div>

        {/* Categories Group */}
        <div className={styles.filterGroup}>
          <h3 className={styles.filterLabel}>Categories</h3>
          <div className={styles.filterList}>
            <button
              onClick={() => updateFilters({ category: null })}
              className={`${styles.filterLink} ${!category ? styles.activeFilterLink : ''}`}
            >
              All Categories
            </button>
            {categoryList?.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => updateFilters({ category: cat.slug })}
                className={`${styles.filterLink} ${category === cat.slug ? styles.activeFilterLink : ''}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Brands Group */}
        <div className={styles.filterGroup}>
          <h3 className={styles.filterLabel}>Brands</h3>
          <div className={styles.filterList}>
            <button
              onClick={() => updateFilters({ brand: null })}
              className={`${styles.filterLink} ${!brand ? styles.activeFilterLink : ''}`}
            >
              All Brands
            </button>
            {brandList?.map((b: any) => (
              <button
                key={b.id}
                onClick={() => updateFilters({ brand: b.slug })}
                className={`${styles.filterLink} ${brand === b.slug ? styles.activeFilterLink : ''}`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range Group */}
        <div className={styles.filterGroup}>
          <h3 className={styles.filterLabel}>Price Range</h3>
          <form onSubmit={handlePriceApply} className={styles.priceForm}>
            <div className={styles.priceRow}>
              <Input
                id="minPrice"
                type="number"
                placeholder="Min"
                value={minInput}
                onChange={(e) => setMinInput(e.target.value)}
                className={styles.priceInput}
              />
              <span className={styles.priceDivider}>to</span>
              <Input
                id="maxPrice"
                type="number"
                placeholder="Max"
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
                className={styles.priceInput}
              />
            </div>
            <Button type="submit" variant="outline" size="sm" fullWidth>
              Apply Price
            </Button>
          </form>
        </div>

        {/* Availability Group */}
        <div className={styles.filterGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => {
                const checked = e.target.checked;
                setInStock(checked);
                updateFilters({ inStock: checked ? 'true' : null });
              }}
              className={styles.checkbox}
            />
            In Stock Only
          </label>
        </div>
      </aside>

      {/* ─── Products List ──────────────────────────────────────── */}
      <main className={styles.main}>
        {/* Top bar (sorting, total results count) */}
        <div className={styles.topbar}>
          <div className={styles.resultsCount}>
            {meta.total} {meta.total === 1 ? 'product' : 'products'} found
            {q && (
              <span>
                {' '}
                for &ldquo;<strong>{q}</strong>&rdquo;
              </span>
            )}
          </div>
          <div className={styles.sortWrapper}>
            <span className={styles.sortLabel}>Sort by:</span>
            <Select
              value={sortBy}
              onChange={(e) => updateFilters({ sortBy: e.target.value })}
              options={[
                { value: 'relevance', label: 'Relevance' },
                { value: 'price_asc', label: 'Price: Low to High' },
                { value: 'price_desc', label: 'Price: High to Low' },
                { value: 'rating', label: 'Avg. Rating' },
                { value: 'newest', label: 'Newest Arrivals' },
              ]}
              className={styles.sortSelect}
            />
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loaderWrapper}>
            <Spinner />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No Products Found"
            description="We couldn't find any products matching your filters. Try resetting them."
            action={
              <Button variant="primary" onClick={handleReset}>
                Reset All Filters
              </Button>
            }
          />
        ) : (
          <>
            <div className={styles.productsGrid}>
              {products.map((product: any) => {
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

            {/* Pagination */}
            <div className={styles.paginationWrapper}>
              <Pagination
                currentPage={page}
                totalPages={meta.totalPages}
                onPageChange={(p) => updateFilters({ page: String(p) })}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading catalog page...</div>}>
      <CardRootLayout />
    </Suspense>
  );
}

function CardRootLayout() {
  return <ProductsCatalog />;
}
