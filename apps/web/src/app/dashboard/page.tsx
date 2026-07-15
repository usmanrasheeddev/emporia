// ═══════════════════════════════════════════════════════════════
// Dashboard Overview Page
// Summarizes account balances, active orders, and default profile cards
// ═══════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Card } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/Badge/Badge';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Table } from '@/components/ui/Table/Table';
import styles from './overview.module.css';

export default function DashboardOverviewPage() {
  const { user } = useAuthStore();

  // Fetch recent orders
  const { data: ordersResponse, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-recent-orders'],
    queryFn: () => api.get<any>('/orders/me?limit=3'),
  });

  // Fetch wallet details
  const { data: walletResponse } = useQuery({
    queryKey: ['my-wallet'],
    queryFn: () => api.get<any>('/payments/wallet'),
  });

  const orders = ordersResponse?.orders || [];
  const walletBalance = walletResponse?.balance || 0;

  return (
    <div className={styles.container}>
      <div className={styles.welcomeStrip}>
        <h1 className={styles.welcomeText}>
          Hello, {user?.firstName} {user?.lastName}
        </h1>
        <p className={styles.welcomeSub}>Manage your orders, wallet balance, and support helpdesk.</p>
      </div>

      {/* Cards summaries Grid */}
      <div className={styles.summaryGrid}>
        <Card padding="md" className={styles.summaryCard}>
          <span className={styles.cardLabel}>Account Wallet</span>
          <div className={styles.cardValue}>${Number(walletBalance).toFixed(2)}</div>
          <Link href="/dashboard/wallet" className={styles.cardLink}>
            Top-up Balance &rarr;
          </Link>
        </Card>

        <Card padding="md" className={styles.summaryCard}>
          <span className={styles.cardLabel}>Active Email</span>
          <div className={styles.cardValueText}>{user?.email}</div>
          <Link href="/dashboard/profile" className={styles.cardLink}>
            Update Settings &rarr;
          </Link>
        </Card>

        <Card padding="md" className={styles.summaryCard}>
          <span className={styles.cardLabel}>Account Role</span>
          <div className={styles.cardValueText}>
            <Badge variant="primary">{user?.role}</Badge>
          </div>
          <span className={styles.cardHelp}>Privileged access level</span>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Orders</h2>
          <Link href="/dashboard/orders" className={styles.viewAllLink}>
            View All Orders
          </Link>
        </div>

        {ordersLoading ? (
          <Spinner />
        ) : orders.length === 0 ? (
          <p className={styles.emptyMsg}>You have not placed any orders yet.</p>
        ) : (
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>Order #</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
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
        )}
      </div>
    </div>
  );
}
