// ═══════════════════════════════════════════════════════════════
// Cart Controller Layer
// Maps HTTP endpoints to persistent or guest Cart services
// ═══════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { CartService } from './cart.service';
import { CartRepository } from './cart.repository';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { RequestWithUser } from '../../types';

const service = new CartService(new CartRepository());

/** Helper to extract user or guest identifiers from request context */
function getCartIdentifiers(req: RequestWithUser) {
  const userId = req.user?.id;
  const guestSessionId = (req.headers['x-guest-session-id'] as string) || req.cookies?.sessionId;
  return { userId, guestSessionId };
}

export class CartController {
  static getCart = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { userId, guestSessionId } = getCartIdentifiers(req);
    const cart = await service.getOrCreateCart(userId, guestSessionId);
    res.json(ApiResponse.success('Cart retrieved successfully', cart));
  });

  static addToCart = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { userId, guestSessionId } = getCartIdentifiers(req);
    const cart = await service.addToCart(userId, guestSessionId, req.body);
    res.json(ApiResponse.success('Item added to cart', cart));
  });

  static updateItem = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { userId, guestSessionId } = getCartIdentifiers(req);
    const itemId = req.params.itemId as string;
    const { quantity } = req.body;

    const cart = await service.updateCartItem(userId, guestSessionId, itemId, quantity);
    res.json(ApiResponse.success('Cart item updated', cart));
  });

  static removeItem = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { userId, guestSessionId } = getCartIdentifiers(req);
    const itemId = req.params.itemId as string;

    const cart = await service.removeCartItem(userId, guestSessionId, itemId);
    res.json(ApiResponse.success('Item removed from cart', cart));
  });

  static clearCart = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const { userId, guestSessionId } = getCartIdentifiers(req);
    const cart = await service.clearCart(userId, guestSessionId);
    res.json(ApiResponse.success('Cart cleared successfully', cart));
  });

  static mergeCart = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const userId = req.user!.id;
    const { sessionId } = req.body;

    const cart = await service.mergeCart(userId, sessionId);
    res.json(ApiResponse.success('Guest cart merged successfully', cart));
  });
}
