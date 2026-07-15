// ═══════════════════════════════════════════════════════════════
// Shipping & Tax Controller Layer
// Maps HTTP endpoints to Shipping and Tax calculation services
// ═══════════════════════════════════════════════════════════════

import { Response } from 'express';
import { ShippingService } from './shipping.service';
import { ShippingRepository } from './shipping.repository';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { RequestWithUser } from '../../types';

const service = new ShippingService(new ShippingRepository());

export class ShippingController {
  static getMethods = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const list = await service.getActiveMethods();
    res.json(ApiResponse.success('Shipping methods retrieved successfully', list));
  });

  static estimate = asyncHandler(async (req: RequestWithUser, res: Response) => {
    const userId = req.user?.id;
    const result = await service.calculateShippingAndTax(userId, req.body);
    res.json(ApiResponse.success('Estimation calculated successfully', result));
  });
}
