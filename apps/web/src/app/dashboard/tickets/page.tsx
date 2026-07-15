// ═══════════════════════════════════════════════════════════════
// Support Tickets Page
// List and create customer support tickets
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Textarea } from '@/components/ui/Textarea/Textarea';
import { Select } from '@/components/ui/Select/Select';
import { Alert } from '@/components/ui/Alert/Alert';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Table } from '@/components/ui/Table/Table';
import { Badge } from '@/components/ui/Badge/Badge';
import { Pagination } from '@/components/ui/Pagination/Pagination';
import styles from './tickets.module.css';

export default function SupportTicketsPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');

  // Fetch customer support tickets
  const { data: ticketsResponse, isLoading } = useQuery({
    queryKey: ['my-support-tickets', page],
    queryFn: () => api.get<any>(`/tickets/my?page=${page}&limit=10`), // Note: endpoint helper route mapped in app.ts router
  });

  const tickets = ticketsResponse?.tickets || [];
  const meta = ticketsResponse?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  // Create ticket Mutation
  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/tickets', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-support-tickets'] });
      setShowAddForm(false);
      setSubject('');
      setDescription('');
      setPriority('MEDIUM');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to submit support ticket');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (subject.trim().length < 5 || description.trim().length < 10) {
      setError('Subject must be at least 5 chars and Description must be 10 chars.');
      return;
    }

    createMutation.mutate({
      subject,
      description,
      priority,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Support Tickets</h1>
          <p className={styles.subtitle}>Submit help requests to our customer desk and review chats</p>
        </div>
        {!showAddForm && (
          <Button variant="primary" size="sm" onClick={() => setShowAddForm(true)}>
            Open Support Ticket
          </Button>
        )}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {showAddForm && (
        <Card padding="md" className={styles.card}>
          <h2 className={styles.cardTitle}>Submit Help Ticket</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <Input
              id="subject"
              label="Subject"
              placeholder="e.g. Issue with payment verification"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
            <Textarea
              id="description"
              label="Description details"
              placeholder="Provide order numbers, tracking IDs, or details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
            <div className={styles.selectWrapper}>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                label="Select Priority"
                options={[
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                  { value: 'URGENT', label: 'Urgent' },
                ]}
              />
            </div>
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" loading={createMutation.isPending}>
                Submit Ticket
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <div className={styles.loaderWrapper}>
          <Spinner size="lg" />
        </div>
      ) : tickets.length === 0 ? (
        <p className={styles.emptyMsg}>No support help tickets logged on this account.</p>
      ) : (
        <>
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>Ticket #</Table.HeaderCell>
                <Table.HeaderCell>Subject</Table.HeaderCell>
                <Table.HeaderCell>Priority</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Last Updated</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {tickets.map((t: any) => (
                <Table.Row key={t.id}>
                  <Table.Cell>
                    <strong>{t.ticketNumber}</strong>
                  </Table.Cell>
                  <Table.Cell>{t.subject}</Table.Cell>
                  <Table.Cell>
                    <Badge variant={t.priority === 'URGENT' || t.priority === 'HIGH' ? 'error' : 'primary'}>
                      {t.priority}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant={t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'success' : 'warning'}>
                      {t.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{new Date(t.updatedAt).toLocaleDateString()}</Table.Cell>
                  <Table.Cell align="right">
                    <Link href={`/dashboard/tickets/${t.id}`} className={styles.detailsLink}>
                      View Chat
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
