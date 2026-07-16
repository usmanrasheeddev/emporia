// ═══════════════════════════════════════════════════════════════
// Order History Page
// Paginated lists of user orders
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge/Badge';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Table } from '@/components/ui/Table/Table';
import { Pagination } from '@/components/ui/Pagination/Pagination';
import styles from './orders.module.css';

export default function OrderHistoryPage() {
  const [page, setPage] = useState(1);

  // Fetch page orders
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['my-orders-list', page],
    queryFn: () => api.get<any>(`/orders/me?page=${page}&limit=10`),
  });

  const orders = ordersResponse?.data || [];
  const meta = ordersResponse?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Order History</h1>
        <p className={styles.subtitle}>Track your purchases and download invoices</p>
      </div>

      {isLoading ? (
        <div className={styles.loaderWrapper}>
          <Spinner size="lg" />
        </div>
      ) : orders.length === 0 ? (
        <p className={styles.emptyMsg}>You have not placed any orders yet.</p>
      ) : (
        <>
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>Order #</Table.HeaderCell>
                <Table.HeaderCell>Placed On</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Payment</Table.HeaderCell>
                <Table.HeaderCell align="right">Total</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {orders.map((order: any) => (
                <Table.Row key={order.id}>
                  <Table.Cell>
                    <strong>{order.orderNumber}</strong>
                  </Table.Cell>
                  <Table.Cell>{new Date(order.createdAt).toLocaleDateString()}</Table.Cell>
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
                  <Table.Cell>
                    <Badge variant={order.paymentStatus === 'COMPLETED' ? 'success' : 'warning'}>
                      {order.paymentStatus}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell align="right">${Number(order.totalAmount).toFixed(2)}</Table.Cell>
                  <Table.Cell align="right">
                    <Link href={`/dashboard/orders/${order.id}`} className={styles.detailsLink}>
                      Details
                    </Link>
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
