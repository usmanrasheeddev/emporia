// ═══════════════════════════════════════════════════════════════
// Coupon Controller Layer
// Maps HTTP endpoints to Coupon services
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { CouponService } from './coupon.service';
import { CouponRepository } from './coupon.repository';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { RequestWithUser } from '../../types';

const service = new CouponService(new CouponRepository());

export class CouponController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const { coupons, meta } = await service.getAll(req.query);
    res.json(ApiResponse.success('Coupons retrieved successfully', coupons, 200, meta));
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const coupon = await service.getById(id);
    res.json(ApiResponse.success('Coupon retrieved successfully', coupon));
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const coupon = await service.create(req.body);
    res.status(201).json(ApiResponse.success('Coupon created successfully', coupon, 201));
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const coupon = await service.update(id, req.body);
    res.json(ApiResponse.success('Coupon updated successfully', coupon));
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await service.delete(id);
    res.json(ApiResponse.success('Coupon deleted successfully'));
  });

  static applyToCart = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const userId = req.user?.id;
    const guestSessionId = (req.headers['x-guest-session-id'] as string) || req.cookies?.sessionId;
    const { code } = req.body;

    const cart = await service.applyCouponToCart(userId, guestSessionId, code);
    res.json(ApiResponse.success('Coupon applied successfully', cart));
  });

  static removeFromCart = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const userId = req.user?.id;
    const guestSessionId = (req.headers['x-guest-session-id'] as string) || req.cookies?.sessionId;

    const cart = await service.removeCouponFromCart(userId, guestSessionId);
    res.json(ApiResponse.success('Coupon removed from cart', cart));
  });
}
