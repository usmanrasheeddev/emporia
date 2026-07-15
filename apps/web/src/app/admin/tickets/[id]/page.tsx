// ═══════════════════════════════════════════════════════════════
// Admin Ticket Detail Chat Page
// Supports staff message logging, chat updates, and resolving ticket status
// ═══════════════════════════════════════════════════════════════

'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Badge } from '@/components/ui/Badge/Badge';
import { Alert } from '@/components/ui/Alert/Alert';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import styles from './ticket-chat.module.css';

export default function AdminTicketChatPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch ticket details (includes messages list)
  const { data: response, isLoading } = useQuery({
    queryKey: ['admin-ticket-details', id],
    queryFn: () => api.get<any>(`/tickets/${id}`),
    enabled: !!id,
  });

  const ticket = response?.data;

  // Send message Mutation
  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      api.post(`/tickets/${id}/messages`, { message: text, isStaffReply: true }),
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['admin-ticket-details', id] });
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to send message reply');
    },
  });

  // Resolve status Mutation
  const resolveMutation = useMutation({
    mutationFn: (status: 'RESOLVED' | 'CLOSED') =>
      api.patch(`/tickets/${id}/status`, { status, note: `Status marked as ${status} by staff` }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ticket-details', id] });
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to resolve support ticket');
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!messageText.trim()) return;

    sendMutation.mutate(messageText.trim());
  };

  if (isLoading) {
    return (
      <div className={styles.loaderWrapper}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <Alert variant="error" title="Ticket Not Found">
        The requested support ticket details could not be located on our servers.
      </Alert>
    );
  }

  const messages = ticket.messages || [];
  const isOpen = ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ticket Chat Desk #{ticket.ticketNumber}</h1>
          <p className={styles.subtitle}>{ticket.subject}</p>
        </div>
        <div className={styles.metaActions}>
          <Badge variant="primary">{ticket.priority}</Badge>
          <Badge variant={isOpen ? 'warning' : 'success'}>{ticket.status}</Badge>

          {isOpen && (
            <div className={styles.controlButtons}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => resolveMutation.mutate('RESOLVED')}
                loading={resolveMutation.isPending}
              >
                Mark Resolved
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => resolveMutation.mutate('CLOSED')}
                loading={resolveMutation.isPending}
              >
                Close Ticket
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className={styles.chatWrapper}>
        {/* Ticket details description header */}
        <div className={styles.ticketDescCard}>
          <div className={styles.descAuthorRow}>
            <strong>
              Created by: {ticket.user?.firstName} {ticket.user?.lastName} ({ticket.user?.email})
            </strong>
            <span className={styles.descDate}>
              {new Date(ticket.createdAt).toLocaleString()}
            </span>
          </div>
          <p className={styles.descText}>{ticket.description}</p>
        </div>

        {/* Message logs */}
        <div className={styles.messagesList}>
          {messages.length === 0 ? (
            <p className={styles.emptyMsg}>No chat history recorded yet.</p>
          ) : (
            messages.map((msg: any) => {
              const isStaff = msg.isStaffReply;
              return (
                <div
                  key={msg.id}
                  className={`${styles.messageBubble} ${isStaff ? styles.staffBubble : styles.userBubble}`}
                >
                  <div className={styles.bubbleHeader}>
                    <strong className={styles.senderName}>
                      {isStaff ? 'Staff Support' : 'Customer'}
                    </strong>
                    <span className={styles.bubbleDate}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className={styles.bubbleText}>{msg.message}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Reply inputs form */}
        {isOpen ? (
          <form onSubmit={handleSendMessage} className={styles.chatForm}>
            <div className={styles.inputWrapper}>
              <Input
                id="chatMsg"
                placeholder="Type your response reply..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={sendMutation.isPending}
              />
            </div>
            <Button type="submit" variant="primary" loading={sendMutation.isPending}>
              Send Reply
            </Button>
          </form>
        ) : (
          <Alert variant="info">Replies are disabled since this support ticket is marked resolved/closed.</Alert>
        )}
      </div>
    </div>
  );
}
