// ═══════════════════════════════════════════════════════════════
// Admin Orders Manager Page
// Coordinates order statuses changes, payments tracking, and list searches
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge/Badge';
import { Alert } from '@/components/ui/Alert/Alert';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Table } from '@/components/ui/Table/Table';
import { Pagination } from '@/components/ui/Pagination/Pagination';
import styles from './orders.module.css';

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch store orders
  const queryParams = new URLSearchParams();
  if (statusFilter) queryParams.set('status', statusFilter);
  queryParams.set('page', String(page));
  queryParams.set('limit', '10');

  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-orders', queryParams.toString()],
    queryFn: () => api.get<any>(`/orders?${queryParams.toString()}`),
  });

  const orders = response?.data || [];
  const meta = response?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  // Status transition Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch(`/orders/${orderId}/status`, {
        status,
        note: `Status updated by administrator to ${status}`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to update order status');
    },
  });

  const handleStatusChange = (orderId: string, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };

  const statusOptions = [
    'PENDING',
    'CONFIRMED',
    'PROCESSING',
    'PACKED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
    'REFUNDED',
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>All Store Orders</h1>
          <p className={styles.subtitle}>Track client transactions and manage shipment processes</p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Filter status row */}
      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Filter status:</span>
          <div className={styles.badgeFilters}>
            <button
              onClick={() => {
                setStatusFilter('');
                setPage(1);
              }}
              className={`${styles.filterBtn} ${!statusFilter ? styles.activeFilter : ''}`}
            >
              All
            </button>
            {statusOptions.map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`${styles.filterBtn} ${statusFilter === st ? styles.activeFilter : ''}`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loaderWrapper}>
          <Spinner size="lg" />
        </div>
      ) : orders.length === 0 ? (
        <p className={styles.emptyMsg}>No customer orders found matching this status.</p>
      ) : (
        <>
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>Order #</Table.HeaderCell>
                <Table.HeaderCell>Customer</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Total</Table.HeaderCell>
                <Table.HeaderCell>Payment</Table.HeaderCell>
                <Table.HeaderCell>Delivery Status</Table.HeaderCell>
                <Table.HeaderCell align="right">Update Status</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {orders.map((order: any) => (
                <Table.Row key={order.id}>
                  <Table.Cell>
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <strong>{order.orderNumber}</strong>
                    </Link>
                  </Table.Cell>
                  <Table.Cell>
                    <div className={styles.customerCell}>
                      <strong>
                        {order.user?.firstName} {order.user?.lastName}
                      </strong>
                      <span className={styles.customerEmail}>{order.user?.email}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>{new Date(order.createdAt).toLocaleDateString()}</Table.Cell>
                  <Table.Cell>${Number(order.totalAmount).toFixed(2)}</Table.Cell>
                  <Table.Cell>
                    <Badge variant={order.paymentStatus === 'COMPLETED' ? 'success' : 'warning'}>
                      {order.paymentStatus}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant={
                        order.status === 'DELIVERED'
                          ? 'success'
                          : order.status === 'CANCELLED'
                          ? 'error'
                          : 'warning'
                      }
                    >
                      {order.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell align="right">
                    <div className={styles.statusUpdateWrapper}>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={styles.statusSelect}
                        disabled={updateStatusMutation.isPending}
                      >
                        {statusOptions.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
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
