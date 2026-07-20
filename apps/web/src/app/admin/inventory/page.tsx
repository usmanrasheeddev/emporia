// ═══════════════════════════════════════════════════════════════
// Admin Inventory & Stock Management Page
// Coordinates warehouse stock metrics, low reorder thresholds, and stock transfers
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Badge } from '@/components/ui/Badge/Badge';
import { Alert } from '@/components/ui/Alert/Alert';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Table } from '@/components/ui/Table/Table';
import { Pagination } from '@/components/ui/Pagination/Pagination';
import styles from './inventory.module.css';

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transfer form fields
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState('');

  // Fetch warehouse list
  const { data: warehouses } = useQuery({
    queryKey: ['admin-warehouses'],
    queryFn: () => api.get<any>('/inventory/warehouses'),
  });

  // Fetch low-stock alerts
  const { data: alertsResponse, isLoading: alertsLoading } = useQuery({
    queryKey: ['admin-low-stock-alerts', page],
    queryFn: () => api.get<any>(`/inventory/low-stock?page=${page}&limit=10`),
  });

  const alerts = alertsResponse?.data || [];
  const meta = alertsResponse?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  // Transfer Mutation
  const transferMutation = useMutation({
    mutationFn: (payload: any) => api.post('/inventory/transfers', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-low-stock-alerts'] });
      setShowTransferForm(false);
      setFromWarehouseId('');
      setToWarehouseId('');
      setVariantId('');
      setQuantity('');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to execute stock transfer request');
    },
  });

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qtyNum = parseInt(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError('Please enter a valid transfer quantity');
      return;
    }

    if (fromWarehouseId === toWarehouseId) {
      setError('Source and Destination warehouses cannot be the same');
      return;
    }

    transferMutation.mutate({
      fromWarehouseId,
      toWarehouseId,
      variantId,
      quantity: qtyNum,
    });
  };

  const warehouseOptions =
    warehouses?.data?.map((w: any) => ({
      value: w.id,
      label: `${w.name} (${w.code})`,
    })) || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Inventory Management</h1>
          <p className={styles.subtitle}>Track multi-warehouse inventory levels and low stock thresholds</p>
        </div>
        {!showTransferForm && (
          <Button variant="primary" size="sm" onClick={() => setShowTransferForm(true)}>
            Execute Stock Transfer
          </Button>
        )}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {showTransferForm && (
        <Card padding="md" className={styles.card}>
          <h2 className={styles.cardTitle}>Initiate Stock Transfer</h2>
          <form onSubmit={handleTransferSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <Select
                id="fromWarehouse"
                label="Source Warehouse"
                value={fromWarehouseId}
                onChange={(e) => setFromWarehouseId(e.target.value)}
                options={warehouseOptions}
                placeholder="Select Source"
                required
              />
              <Select
                id="toWarehouse"
                label="Destination Warehouse"
                value={toWarehouseId}
                onChange={(e) => setToWarehouseId(e.target.value)}
                options={warehouseOptions}
                placeholder="Select Destination"
                required
              />
              <Input
                id="variantId"
                label="Product Variant ID"
                placeholder="Paste SKU/Variant UUID"
                value={variantId}
                onChange={(e) => setVariantId(e.target.value)}
                required
              />
              <Input
                id="qty"
                type="number"
                label="Transfer Quantity"
                placeholder="10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" loading={transferMutation.isPending}>
                Initiate Transfer
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowTransferForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Low stock indicators lists */}
      <div className={styles.ledgerSection}>
        <h2 className={styles.ledgerTitle}>Low Stock Reorder Alerts</h2>

        {alertsLoading ? (
          <div className={styles.loaderWrapper}>
            <Spinner size="lg" />
          </div>
        ) : alerts.length === 0 ? (
          <p className={styles.emptyMsg}>All product variant warehouse stocks are above reorder limits.</p>
        ) : (
          <>
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell>Product / Variant</Table.HeaderCell>
                  <Table.HeaderCell>Warehouse</Table.HeaderCell>
                  <Table.HeaderCell align="center">Stock Level</Table.HeaderCell>
                  <Table.HeaderCell align="center">Reorder Point</Table.HeaderCell>
                  <Table.HeaderCell align="right">Status</Table.HeaderCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {alerts.map((item: any) => (
                  <Table.Row key={item.id}>
                    <Table.Cell>
                      <strong>{item.variant?.product?.name}</strong>
                      <span className={styles.variantName}>{item.variant?.name}</span>
                    </Table.Cell>
                    <Table.Cell>{item.warehouse?.name}</Table.Cell>
                    <Table.Cell align="center" className={styles.lowStockText}>
                      {item.quantity}
                    </Table.Cell>
                    <Table.Cell align="center">{item.reorderPoint}</Table.Cell>
                    <Table.Cell align="right">
                      <Badge variant="error">REORDER</Badge>
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
    </div>
  );
}
