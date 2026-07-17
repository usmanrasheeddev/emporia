// ═══════════════════════════════════════════════════════════════
// Support Ticket Database Repository
// Handles transactional creation, read-status changes, and message lists
// ═══════════════════════════════════════════════════════════════

import { prisma } from '../../config/database';
import { SupportTicket, SupportMessage } from '@prisma/client';
import { TicketPriority } from '@nexastore/shared';

export class TicketRepository {
  /**
   * Transactional creation of a SupportTicket and its initial description message
   */
  async createTicketWithInitialMessage(data: {
    userId: string;
    ticketNumber: string;
    subject: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    description: string;
  }): Promise<SupportTicket> {
    return prisma.$transaction(async (tx) => {
      // 1. Create the parent ticket
      const ticket = await tx.supportTicket.create({
        data: {
          userId: data.userId,
          ticketNumber: data.ticketNumber,
          subject: data.subject,
          priority: data.priority,
          description: data.description,
        },
      });

      // 2. Create the initial message containing the description
      await tx.supportMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: data.userId,
          message: data.description,
          isStaffReply: false,
          isRead: true, // Initial message read by creator
        },
      });

      return ticket;
    });
  }

  /**
   * Retrieves user's tickets or all tickets (if admin/agent)
   */
  async getTicketsByUserId(
    userId: string,
    isAdmin: boolean,
    page: number,
    limit: number
  ): Promise<{ tickets: SupportTicket[]; total: number }> {
    const skip = (page - 1) * limit;
    const where = isAdmin ? {} : { userId };

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return { tickets, total };
  }

  /**
   * Retrieves single ticket details by ID
   */
  async getTicketById(id: string): Promise<SupportTicket | null> {
    return prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Inserts new message to chat thread
   */
  async createMessage(data: {
    ticketId: string;
    senderId: string;
    message: string;
    isStaffReply: boolean;
  }): Promise<SupportMessage> {
    return prisma.$transaction(async (tx) => {
      // 1. Create message
      const msg = await tx.supportMessage.create({
        data: {
          ticketId: data.ticketId,
          senderId: data.senderId,
          message: data.message,
          isStaffReply: data.isStaffReply,
          isRead: false,
        },
      });

      // 2. Update ticket's updatedAt timestamp
      await tx.supportTicket.update({
        where: { id: data.ticketId },
        data: { updatedAt: new Date() },
      });

      return msg;
    });
  }

  /**
   * Mark all messages in a ticket that are NOT sent by the current sender as read
   */
  async markMessagesAsRead(ticketId: string, currentUserId: string): Promise<void> {
    await prisma.supportMessage.updateMany({
      where: {
        ticketId,
        senderId: { not: currentUserId },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }
}
