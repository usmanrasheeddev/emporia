// ═══════════════════════════════════════════════════════════════
// Cart Routes
// Optional auth routes for persistent/guest carts and merge triggers
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { CartController } from './cart.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware';
import { addToCartSchema, updateCartItemSchema, mergeCartSchema } from './cart.validator';

const router = Router();

// Guest/Persistent operations
router.get('/', optionalAuthenticate, CartController.getCart);
router.post('/', optionalAuthenticate, validate(addToCartSchema), CartController.addToCart);
router.patch('/:itemId', optionalAuthenticate, validate(updateCartItemSchema), CartController.updateItem);
router.delete('/:itemId', optionalAuthenticate, CartController.removeItem);
router.delete('/', optionalAuthenticate, CartController.clearCart);

// Secure customer merge triggers
router.post('/merge', authenticate, validate(mergeCartSchema), CartController.mergeCart);

export default router;
//
