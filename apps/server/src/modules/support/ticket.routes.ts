// ═══════════════════════════════════════════════════════════════
// Support Ticket Route Declarations
// Hooks authentication, validation, limiters, and controller
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { TicketController } from './ticket.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { supportLimiter, messageLimiter } from '../../middleware/rate-limit.middleware';
import { createTicketSchema, replyTicketSchema } from './ticket.validator';

const router = Router();

// Apply global auth to all tickets endpoints
router.use(authenticate);

router.post('/', supportLimiter, validate(createTicketSchema), TicketController.create);
router.get('/', TicketController.getMyTickets);
router.get('/my', TicketController.getMyTickets);
router.get('/:id', TicketController.getById);
router.post('/:id/messages', messageLimiter, validate(replyTicketSchema), TicketController.reply);

export default router;
