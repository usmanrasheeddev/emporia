// ═══════════════════════════════════════════════════════════════
// Admin Analytics Overview Page
// Summarizes total orders, overall revenue, product counts, and daily metrics
// ═══════════════════════════════════════════════════════════════

'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card/Card';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Table } from '@/components/ui/Table/Table';
import styles from './analytics.module.css';

export default function AdminAnalyticsPage() {
  // Fetch general store stats (from order service dashboards/daily analytics)
  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-store-stats'],
    queryFn: () => api.get<any>('/orders/dashboard/stats'), // Mapped in server endpoints
  });

  // Fetch daily transactions history
  const { data: dailyResponse, isLoading: dailyLoading } = useQuery({
    queryKey: ['admin-daily-analytics'],
    queryFn: () => api.get<any[]>('/orders/dashboard/daily'),
  });

  const stats = statsResponse?.data || {
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
  };

  const dailyRecords = dailyResponse || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Analytics Overview</h1>
        <p className={styles.subtitle}>Review overall store performance and sales logs</p>
      </div>

      {statsLoading ? (
        <div className={styles.loaderWrapper}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div className={styles.statsGrid}>
          <Card padding="md" className={styles.statCard}>
            <span className={styles.statLabel}>Total Orders</span>
            <div className={styles.statValue}>{stats.totalOrders}</div>
            <span className={styles.statSub}>Overall transaction count</span>
          </Card>

          <Card padding="md" className={styles.statCard}>
            <span className={styles.statLabel}>Overall Revenue</span>
            <div className={styles.statValue}>${Number(stats.totalRevenue).toFixed(2)}</div>
            <span className={styles.statSub}>Total sales turnover</span>
          </Card>

          <Card padding="md" className={styles.statCard}>
            <span className={styles.statLabel}>Active Customers</span>
            <div className={styles.statValue}>{stats.totalCustomers}</div>
            <span className={styles.statSub}>Registered client logins</span>
          </Card>

          <Card padding="md" className={styles.statCard}>
            <span className={styles.statLabel}>Catalog Products</span>
            <div className={styles.statValue}>{stats.totalProducts}</div>
            <span className={styles.statSub}>Total active catalog SKUs</span>
          </Card>
        </div>
      )}

      {/* Daily Performance Ledger */}
      <div className={styles.ledgerSection}>
        <h2 className={styles.ledgerTitle}>Daily Performance Log</h2>

        {dailyLoading ? (
          <Spinner />
        ) : dailyRecords.length === 0 ? (
          <p className={styles.emptyMsg}>No daily sales metrics recorded yet.</p>
        ) : (
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Orders Count</Table.HeaderCell>
                <Table.HeaderCell align="right">Revenue Turnover</Table.HeaderCell>
                <Table.HeaderCell align="right">Avg. Order Value</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {dailyRecords.map((rec: any, idx: number) => (
                <Table.Row key={idx}>
                  <Table.Cell>
                    <strong>{new Date(rec.date).toLocaleDateString()}</strong>
                  </Table.Cell>
                  <Table.Cell>{rec.ordersCount}</Table.Cell>
                  <Table.Cell align="right">${Number(rec.revenue).toFixed(2)}</Table.Cell>
                  <Table.Cell align="right">
                    ${Number(rec.avgOrderValue || 0).toFixed(2)}
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
