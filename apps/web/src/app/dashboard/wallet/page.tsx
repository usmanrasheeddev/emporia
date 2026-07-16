// ═══════════════════════════════════════════════════════════════
// Wallet & Top-up Page
// Displays current wallet credit balance, top-up actions, and ledger records
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Alert } from '@/components/ui/Alert/Alert';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Table } from '@/components/ui/Table/Table';
import { Badge } from '@/components/ui/Badge/Badge';
import { Pagination } from '@/components/ui/Pagination/Pagination';
import styles from './wallet.module.css';

export default function WalletPage() {
  const [topUpAmount, setTopUpAmount] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Fetch wallet details and transaction history ledger
  const { data: walletResponse, isLoading } = useQuery({
    queryKey: ['my-wallet-ledger', page],
    queryFn: () => api.get<any>(`/payments/wallet?page=${page}&limit=10`),
  });

  const wallet = walletResponse?.data || { balance: 0, transactions: [], meta: { totalPages: 1 } };

  // Top up Mutation
  const topUpMutation = useMutation({
    mutationFn: (amount: number) => api.post<any>('/payments/wallet/topup', { amount }),
    onSuccess: (res) => {
      if (res.data?.sessionUrl) {
        window.location.href = res.data.sessionUrl;
      }
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to initialize top-up payment');
    },
  });

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(topUpAmount);
    if (isNaN(amountNum) || amountNum < 5) {
      setError('Please enter a valid top-up amount (Minimum is $5.00)');
      return;
    }

    topUpMutation.mutate(amountNum);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Account Wallet</h1>
        <p className={styles.subtitle}>Pre-load credit balances to shop instantly without cards</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className={styles.dashboardGrid}>
        {/* Wallet Balance Card */}
        <Card padding="lg" className={styles.balanceCard}>
          <span className={styles.balanceLabel}>Current Balance</span>
          <div className={styles.balanceValue}>
            {isLoading ? <Spinner size="sm" /> : `$${Number(wallet.balance).toFixed(2)}`}
          </div>
          <p className={styles.balanceHelp}>
            Use your wallet balance to checkout instantly on any order.
          </p>
        </Card>

        {/* Top-up Form Card */}
        <Card padding="lg" className={styles.topUpCard}>
          <h2 className={styles.cardTitle}>Load Wallet Balance</h2>
          <form onSubmit={handleTopUpSubmit} className={styles.topUpForm}>
            <div className={styles.inputWrapper}>
              <Input
                id="topUpAmount"
                type="number"
                placeholder="25.00"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                required
                disabled={topUpMutation.isPending}
                hint="Minimum load is $5.00. Powered by Stripe checkout."
              />
            </div>
            <Button type="submit" variant="primary" loading={topUpMutation.isPending}>
              Load Credits
            </Button>
          </form>
        </Card>
      </div>

      {/* Transactions History Ledger */}
      <div className={styles.ledgerSection}>
        <h2 className={styles.ledgerTitle}>Transaction History Ledger</h2>

        {isLoading ? (
          <Spinner />
        ) : !wallet.transactions || wallet.transactions.length === 0 ? (
          <p className={styles.emptyMsg}>No transactions recorded on this account wallet.</p>
        ) : (
          <>
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell>Transaction ID</Table.HeaderCell>
                  <Table.HeaderCell>Type</Table.HeaderCell>
                  <Table.HeaderCell>Description</Table.HeaderCell>
                  <Table.HeaderCell>Amount</Table.HeaderCell>
                  <Table.HeaderCell>Logged On</Table.HeaderCell>
                  <Table.HeaderCell align="right">Balance</Table.HeaderCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {wallet.transactions.map((tx: any) => (
                  <Table.Row key={tx.id}>
                    <Table.Cell>
                      <code className={styles.txCode}>{tx.id.substring(0, 8)}...</code>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={tx.type === 'CREDIT' ? 'success' : 'error'}>{tx.type}</Badge>
                    </Table.Cell>
                    <Table.Cell>{tx.description}</Table.Cell>
                    <Table.Cell className={tx.type === 'CREDIT' ? styles.creditText : styles.debitText}>
                      {tx.type === 'CREDIT' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                    </Table.Cell>
                    <Table.Cell>{new Date(tx.createdAt).toLocaleString()}</Table.Cell>
                    <Table.Cell align="right">${Number(tx.balance).toFixed(2)}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>

            {/* Pagination */}
            <div className={styles.paginationWrapper}>
              <Pagination
                currentPage={page}
                totalPages={wallet.meta?.totalPages || 1}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
