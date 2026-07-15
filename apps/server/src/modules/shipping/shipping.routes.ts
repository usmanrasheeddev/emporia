// ═══════════════════════════════════════════════════════════════
// Shipping & Tax Routes
// Public endpoints for shipping methods and tax estimation calculators
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import { ShippingController } from './shipping.controller';
import { validate } from '../../middleware/validate.middleware';
import { optionalAuthenticate } from '../../middleware/auth.middleware';
import { calculateShippingTaxSchema } from './shipping.validator';

const router = Router();

router.get('/methods', optionalAuthenticate, ShippingController.getMethods);
router.post('/estimate', optionalAuthenticate, validate(calculateShippingTaxSchema), ShippingController.estimate);

export default router;
//
