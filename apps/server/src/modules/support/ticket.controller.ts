// ═══════════════════════════════════════════════════════════════
// Support Ticket Controller Layer
// Parses parameters and formats standardized paginated API responses
// ═══════════════════════════════════════════════════════════════

import { Response } from 'express';
import { TicketService } from './ticket.service';
import { TicketRepository } from './ticket.repository';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { RequestWithUser } from '../../types';

const repository = new TicketRepository();
const service = new TicketService(repository);

export class TicketController {
  static create = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const userId = req.user!.id;
    const ticket = await service.createTicket(userId, req.body);
    res.status(201).json(ApiResponse.success('Support ticket created successfully', ticket, 201));
  });

  static getMyTickets = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const userId = req.user!.id;
    const role = req.user!.role;
    const { tickets, meta } = await service.getMyTickets(
      userId,
      role,
      req.query
    );

    res.json(
      ApiResponse.success('Tickets retrieved successfully', tickets, 200, meta)
    );
  });

  static getById = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const role = req.user!.role;
    const ticket = await service.getTicketDetails(id, userId, role);

    res.json(ApiResponse.success('Ticket details retrieved successfully', ticket));
  });

  static reply = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const role = req.user!.role;
    const { message } = req.body;
    const msg = await service.replyToTicket(id, userId, role, message);

    res.status(201).json(ApiResponse.success('Reply submitted successfully', msg, 201));
  });
}
