// ═══════════════════════════════════════════════════════════════
// Support Ticket Service Layer
// Enforces sanitization, generates ticket IDs, checks owner authentication
// ═══════════════════════════════════════════════════════════════

import sanitizeHtml from 'sanitize-html';
import { TicketRepository } from './ticket.repository';
import { ApiError } from '../../utils/api-error';
import { SupportTicket, SupportMessage } from '@prisma/client';
import { UserRole, PaginationMeta } from '@nexastore/shared';
import { buildPaginationMeta } from '../../utils/pagination';

const sanitizeOptions = {
  allowedTags: [], // Strip all HTML tags entirely for maximum security
  allowedAttributes: {},
};

export class TicketService {
  constructor(private readonly repo: TicketRepository) {}

  /**
   * Creates a new support ticket and its initial message
   */
  async createTicket(userId: string, data: {
    subject: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  }): Promise<SupportTicket> {
    // 1. Sanitize input fields to prevent XSS
    const sanitizedSubject = sanitizeHtml(data.subject, sanitizeOptions).trim();
    const sanitizedDescription = sanitizeHtml(data.description, sanitizeOptions).trim();

    if (sanitizedSubject.length < 5) {
      throw ApiError.badRequest('Subject must be at least 5 characters');
    }
    if (sanitizedDescription.length < 10) {
      throw ApiError.badRequest('Description must be at least 10 characters');
    }

    // 2. Generate a clean unique ticket number
    const ticketNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    return this.repo.createTicketWithInitialMessage({
      userId,
      ticketNumber,
      subject: sanitizedSubject,
      priority: data.priority,
      description: sanitizedDescription,
    });
  }

  /**
   * Returns list of user's support tickets with standard pagination metadata
   */
  async getMyTickets(
    userId: string,
    role: string,
    query: { page?: string; limit?: string }
  ): Promise<{ tickets: SupportTicket[]; meta: PaginationMeta }> {
    const pageNum = parseInt(query.page || '1', 10);
    const limitNum = parseInt(query.limit || '10', 10);

    const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
    const { tickets, total } = await this.repo.getTicketsByUserId(userId, isAdmin, pageNum, limitNum);

    return {
      tickets,
      meta: buildPaginationMeta(total, pageNum, limitNum),
    };
  }

  /**
   * Retrieves ticket details by ID, checking authorization and marking read status
   */
  async getTicketDetails(id: string, userId: string, role: string): Promise<SupportTicket> {
    const ticket = await this.repo.getTicketById(id);
    if (!ticket) {
      throw ApiError.notFound('Support ticket not found');
    }

    // Authorization: User must own the ticket, or be Admin/SuperAdmin
    const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
    if (ticket.userId !== userId && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to view this ticket');
    }

    // Atomic read-status update: mark unread messages from opposite party as read
    await this.repo.markMessagesAsRead(id, userId);

    // Fetch fresh details with updated read states
    const updatedTicket = await this.repo.getTicketById(id);
    return updatedTicket!;
  }

  /**
   * Sends a new reply message inside ticket thread
   */
  async replyToTicket(
    id: string,
    userId: string,
    role: string,
    messageText: string
  ): Promise<SupportMessage> {
    const ticket = await this.repo.getTicketById(id);
    if (!ticket) {
      throw ApiError.notFound('Support ticket not found');
    }

    if (ticket.status === 'CLOSED') {
      throw ApiError.badRequest('Cannot reply to a closed ticket');
    }

    // Authorization: User must own the ticket or be Admin/SuperAdmin
    const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
    if (ticket.userId !== userId && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to reply to this ticket');
    }

    const sanitizedMessage = sanitizeHtml(messageText, sanitizeOptions).trim();
    if (!sanitizedMessage) {
      throw ApiError.badRequest('Message cannot be empty');
    }

    const isStaffReply = isAdmin;
    const msg = await this.repo.createMessage({
      ticketId: id,
      senderId: userId,
      message: sanitizedMessage,
      isStaffReply,
    });

    return msg;
  }
}
