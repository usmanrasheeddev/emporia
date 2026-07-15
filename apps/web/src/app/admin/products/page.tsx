// ═══════════════════════════════════════════════════════════════
// Admin Products Management Page
// Coordinates products listing, searching, pagination, and deletion/archive
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button/Button';
import { SearchBar } from '@/components/ui/SearchBar/SearchBar';
import { Badge } from '@/components/ui/Badge/Badge';
import { Alert } from '@/components/ui/Alert/Alert';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Table } from '@/components/ui/Table/Table';
import { Pagination } from '@/components/ui/Pagination/Pagination';
import styles from './products.module.css';

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Fetch admin products catalog list
  const { data: catalogResponse, isLoading } = useQuery({
    queryKey: ['admin-products', search, page],
    queryFn: () => api.get<any>(`/products?search=${search}&page=${page}&limit=10`),
  });

  const products = catalogResponse?.data || [];
  const meta = catalogResponse?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  // Archive/delete Mutation
  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to archive catalog product SKU');
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete/archive this product?')) {
      archiveMutation.mutate(id);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Products Management</h1>
          <p className={styles.subtitle}>Add catalog items, configure specs, and edit pricing</p>
        </div>
        <Link href="/admin/products/new">
          <Button variant="primary" size="sm">
            Add New Product
          </Button>
        </Link>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Top search filter bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search by SKU, name, or slug..."
          />
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loaderWrapper}>
          <Spinner size="lg" />
        </div>
      ) : products.length === 0 ? (
        <p className={styles.emptyMsg}>No products match your catalog criteria.</p>
      ) : (
        <>
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>Product</Table.HeaderCell>
                <Table.HeaderCell>SKU</Table.HeaderCell>
                <Table.HeaderCell>Base Price</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell align="center">Variants</Table.HeaderCell>
                <Table.HeaderCell align="right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {products.map((product: any) => (
                <Table.Row key={product.id}>
                  <Table.Cell>
                    <div className={styles.productCell}>
                      <img
                        src={product.images?.[0]?.url || 'https://placehold.co/50x50/e5e7eb/111827?text=Product'}
                        alt={product.name}
                        className={styles.productImg}
                      />
                      <div className={styles.productMeta}>
                        <strong>{product.name}</strong>
                        <span className={styles.categoryName}>{product.category?.name}</span>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <code>{product.sku}</code>
                  </Table.Cell>
                  <Table.Cell>${Number(product.basePrice).toFixed(2)}</Table.Cell>
                  <Table.Cell>
                    <Badge variant={product.status === 'ACTIVE' ? 'success' : 'warning'}>
                      {product.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell align="center">{product.variants?.length || 0}</Table.Cell>
                  <Table.Cell align="right">
                    <div className={styles.actionsCell}>
                      <Link href={`/admin/products/edit/${product.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        loading={archiveMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {/* Pagination */}
          <div className={styles.paginationWrapper}>
            <Pagination
              currentPage={page}
              totalPages={meta.totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}
