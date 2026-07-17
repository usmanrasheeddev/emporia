// ═══════════════════════════════════════════════════════════════
// Admin Support Desk Tickets Page
// Coordinates help tickets list and responses assignations
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { Alert } from '@/components/ui/Alert/Alert';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Table } from '@/components/ui/Table/Table';
import { Pagination } from '@/components/ui/Pagination/Pagination';
import styles from './tickets.module.css';

export default function AdminTicketsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Fetch all help desk support tickets
  const { data: ticketsResponse, isLoading } = useQuery({
    queryKey: ['admin-tickets-list', page],
    queryFn: () => api.get<any>(`/tickets?page=${page}&limit=10`), // Endpoint defined in server support tickets routing
  });

  const tickets = ticketsResponse?.data || [];
  const meta = ticketsResponse?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  // Assign staff ticket Mutation
  const assignMutation = useMutation({
    mutationFn: (ticketId: string) => api.patch(`/tickets/${ticketId}/assign`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets-list'] });
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to assign ticket to your console');
    },
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Support Desk Tickets</h1>
          <p className={styles.subtitle}>Manage customer queries, assign agents, and reply to chats</p>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {isLoading ? (
        <div className={styles.loaderWrapper}>
          <Spinner size="lg" />
        </div>
      ) : tickets.length === 0 ? (
        <p className={styles.emptyMsg}>No customer support tickets registered.</p>
      ) : (
        <>
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>Ticket #</Table.HeaderCell>
                <Table.HeaderCell>Customer</Table.HeaderCell>
                <Table.HeaderCell>Subject</Table.HeaderCell>
                <Table.HeaderCell>Priority</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Assigned Agent</Table.HeaderCell>
                <Table.HeaderCell align="right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {tickets.map((t: any) => (
                <Table.Row key={t.id}>
                  <Table.Cell>
                    <strong>{t.ticketNumber}</strong>
                  </Table.Cell>
                  <Table.Cell>
                    <div className={styles.customerCell}>
                      <strong>
                        {t.user?.firstName} {t.user?.lastName}
                      </strong>
                      <span className={styles.customerEmail}>{t.user?.email}</span>
                    </div>
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
                  <Table.Cell>
                    {t.assignedTo ? (
                      <span>
                        {t.assignedTo.firstName} {t.assignedTo.lastName}
                      </span>
                    ) : (
                      <span className={styles.unassignedText}>Unassigned</span>
                    )}
                  </Table.Cell>
                  <Table.Cell align="right">
                    <div className={styles.actionsCell}>
                      {!t.assignedTo && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => assignMutation.mutate(t.id)}
                          loading={assignMutation.isPending}
                        >
                          Claim
                        </Button>
                      )}
                      <Link href={`/admin/tickets/${t.id}`}>
                        <Button variant="primary" size="sm">
                          Chat
                        </Button>
                      </Link>
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
