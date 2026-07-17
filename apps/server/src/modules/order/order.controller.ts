// ═══════════════════════════════════════════════════════════════
// Order Controller Layer
// Maps HTTP endpoints to Order checkout and history services
// ═══════════════════════════════════════════════════════════════

import { Response } from 'express';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { RequestWithUser } from '../../types';
import { UserRole } from '@nexastore/shared';

const service = new OrderService(new OrderRepository());

export class OrderController {
  static create = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const userId = req.user!.id;
    const order = await service.createOrder(userId, req.body);
    res.status(201).json(ApiResponse.success('Order placed successfully', order, 201));
  });

  static getById = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const id = req.params.id as string;
    const isAdmin =
      req.user!.role === UserRole.ADMIN ||
      req.user!.role === UserRole.SUPER_ADMIN ||
      req.user!.role === UserRole.MODERATOR;

    const order = await service.getOrderById(id, req.user!.id, isAdmin);
    res.json(ApiResponse.success('Order details retrieved', order));
  });

  static getMyOrders = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const userId = req.user!.id;
    const { orders, meta } = await service.getMyOrders(userId, req.query);
    res.json(ApiResponse.success('My orders list retrieved', orders, 200, meta));
  });

  static getAll = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { orders, meta } = await service.getAllOrders(req.query);
    res.json(ApiResponse.success('Orders directory retrieved successfully', orders, 200, meta));
  });

  static updateStatus = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const id = req.params.id as string;
    const { status, note } = req.body;
    const updated = await service.updateStatus(id, status, req.user!.id, note);
    res.json(ApiResponse.success('Order status updated successfully', updated));
  });

  static getDashboardStats = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const stats = await service.getDashboardStats();
    res.json(ApiResponse.success('Dashboard stats retrieved successfully', stats));
  });

  static getDailyAnalytics = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const daily = await service.getDailyAnalytics();
    res.json(ApiResponse.success('Daily transactions ledger retrieved successfully', daily));
  });
}
