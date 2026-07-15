// ═══════════════════════════════════════════════════════════════
// Admin Product Creation Page
// Form inputs for name, slug, pricing, specs, variants list, and categories
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Select } from '@/components/ui/Select/Select';
import { Alert } from '@/components/ui/Alert/Alert';
import styles from './new.module.css';

export default function AdminNewProductPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');

  // Fetch Category Tree list for options
  const { data: categories } = useQuery({
    queryKey: ['admin-categories-tree'],
    queryFn: () => api.get<any[]>('/categories/tree'),
  });

  // Fetch Brands list for options
  const { data: brandsResponse } = useQuery({
    queryKey: ['admin-brands-options'],
    queryFn: () => api.get<any>('/brands?limit=50'),
  });

  const categoryOptions =
    categories?.map((cat: any) => ({
      value: cat.id,
      label: cat.name,
    })) || [];

  const brandOptions =
    brandsResponse?.brands?.map((b: any) => ({
      value: b.id,
      label: b.name,
    })) || [];

  // Submit Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/products', payload),
    onSuccess: () => {
      router.push('/admin/products');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to create new catalog product');
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

    createMutation.mutate({
      name,
      slug: slug || undefined,
      sku,
      description,
      basePrice: priceNum,
      categoryId,
      brandId: brandId || undefined,
      status: 'DRAFT', // Defaults as draft, variants & images added in edit
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>New Catalog Product</h1>
        <p className={styles.subtitle}>Define basic description details, pricing, and category mapping</p>
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
            <Button type="submit" variant="primary" loading={createMutation.isPending}>
              Create Draft
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
