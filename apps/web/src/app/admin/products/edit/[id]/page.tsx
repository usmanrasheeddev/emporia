// ═══════════════════════════════════════════════════════════════
// Admin Edit Product Page
// Fetches product details and updates catalog description and mappings
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Alert } from '@/components/ui/Alert/Alert';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import styles from '../../../products.module.css';

export default function AdminEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [error, setError] = useState<string | null>(null);

  // Fetch Category Tree list for options
  const { data: categories } = useQuery({
    queryKey: ['admin-categories-tree'],
    queryFn: () => api.get<any>('/categories/tree'),
  });

  // Fetch Brands list for options
  const { data: brandsResponse } = useQuery({
    queryKey: ['admin-brands-options'],
    queryFn: () => api.get<any>('/brands?limit=50'),
  });

  // Fetch product details to prefill
  const { data: productResponse, isLoading, error: fetchError } = useQuery({
    queryKey: ['admin-product-details', id],
    queryFn: () => api.get<any>(`/products/${id}`),
    enabled: !!id,
  });

  const product = productResponse?.data;

  // Sync state with product data
  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setSlug(product.slug || '');
      setSku(product.sku || '');
      setBasePrice(product.basePrice ? String(product.basePrice) : '');
      setCategoryId(product.categoryId || '');
      setBrandId(product.brandId || '');
      setDescription(product.description || '');
      setStatus(product.status || 'DRAFT');
    }
  }, [product]);

  const categoryOptions =
    categories?.data?.map((cat: any) => ({
      value: cat.id,
      label: cat.name,
    })) || [];

  const brandOptions =
    brandsResponse?.data?.map((b: any) => ({
      value: b.id,
      label: b.name,
    })) || [];

  const statusOptions = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'ARCHIVED', label: 'Archived' },
    { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
  ];

  // Submit Update Mutation
  const updateMutation = useMutation({
    mutationFn: (payload: any) => api.patch(`/products/${id}`, payload),
    onSuccess: () => {
      router.push('/admin/products');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update catalog product');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceNum = parseFloat(basePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid base price');
      return;
    }

    if (!categoryId) {
      setError('Please select a category');
      return;
    }

    updateMutation.mutate({
      name,
      slug,
      sku,
      description,
      basePrice: priceNum,
      categoryId,
      brandId: brandId || null,
      status,
    });
  };

  if (isLoading) {
    return (
      <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (fetchError || !product) {
    return (
      <div className={styles.container}>
        <Alert variant="error">Failed to load product details or product does not exist.</Alert>
        <Button variant="outline" onClick={() => router.push('/admin/products')}>Back to Products</Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Edit Catalog Product</h1>
          <p className={styles.subtitle}>Update catalog items description, pricing, status and details</p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card padding="md" className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <Input
              id="name"
              label="Product Name"
              placeholder="e.g. Premium Leather Jacket"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)+/g, '')
                );
              }}
              required
            />

            <Input
              id="slug"
              label="Slug Identifier (URL friendly)"
              placeholder="e.g. premium-leather-jacket"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />

            <Input
              id="sku"
              label="Primary SKU Code"
              placeholder="e.g. LTHR-JKT-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
            />

            <Input
              id="basePrice"
              type="number"
              label="Base Retail Price ($)"
              placeholder="149.99"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
            />

            <Select
              id="categoryId"
              label="Product Category mapping"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={categoryOptions}
              placeholder="Select Category"
              required
            />

            <Select
              id="brandId"
              label="Product Brand (Optional)"
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              options={brandOptions}
              placeholder="Select Brand"
            />

            <Select
              id="status"
              label="Product Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={statusOptions}
              required
            />
          </div>

          <Textarea
            id="description"
            label="Detailed Description"
            placeholder="Describe overall product details, sizing specs, apparel care, etc..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
          />

          <div className={styles.formActions}>
            <Button type="submit" variant="primary" loading={updateMutation.isPending}>
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
