// ═══════════════════════════════════════════════════════════════
// Support Ticket Details Chat Page
// Chat logs history and messaging interface
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
import styles from './ticket-details.module.css';

export default function TicketDetailsPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch ticket details (includes messages)
  const { data: response, isLoading } = useQuery({
    queryKey: ['ticket-details', id],
    queryFn: () => api.get<any>(`/tickets/${id}`),
    enabled: !!id,
  });

  const ticket = response?.data;

  // Send message Mutation
  const sendMutation = useMutation({
    mutationFn: (text: string) => api.post(`/tickets/${id}/messages`, { message: text }),
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['ticket-details', id] });
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to send message');
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
        The requested support ticket could not be found or you do not have permission to view it.
      </Alert>
    );
  }

  const messages = ticket.messages || [];
  const isOpen = ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ticket #{ticket.ticketNumber}</h1>
          <p className={styles.subtitle}>{ticket.subject}</p>
        </div>
        <div className={styles.metaBadges}>
          <Badge variant="primary">{ticket.priority}</Badge>
          <Badge variant={isOpen ? 'warning' : 'success'}>{ticket.status}</Badge>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className={styles.chatWrapper}>
        {/* Description details item */}
        <div className={styles.ticketDescCard}>
          <span className={styles.descLabel}>Ticket Description Details</span>
          <p className={styles.descText}>{ticket.description}</p>
          <span className={styles.descDate}>
            Opened on {new Date(ticket.createdAt).toLocaleString()}
          </span>
        </div>

        {/* Message Logs timeline */}
        <div className={styles.messagesList}>
          {messages.length === 0 ? (
            <p className={styles.emptyMsg}>No messages logged. Wait for staff response.</p>
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
                      {isStaff ? 'Support Representative' : 'You'}
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

        {/* Send message text box */}
        {isOpen ? (
          <form onSubmit={handleSendMessage} className={styles.chatForm}>
            <div className={styles.inputWrapper}>
              <Input
                id="chatMsg"
                placeholder="Type your message reply..."
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
          <Alert variant="info">This ticket is marked as {ticket.status} and replies are disabled.</Alert>
        )}
      </div>
    </div>
  );
}
