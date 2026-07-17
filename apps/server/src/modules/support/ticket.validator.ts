// ═══════════════════════════════════════════════════════════════
// Support Ticket Request Validators
// Declares input constraints using Zod
// ═══════════════════════════════════════════════════════════════

import { z } from 'zod';

export const createTicketSchema = z.object({
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject cannot exceed 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    errorMap: () => ({ message: 'Priority must be LOW, MEDIUM, HIGH, or URGENT' }),
  }),
});

export const replyTicketSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(1000, 'Message cannot exceed 1000 characters'),
});
