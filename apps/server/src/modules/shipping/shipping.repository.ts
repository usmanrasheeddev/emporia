// ═══════════════════════════════════════════════════════════════
// Shipping & Tax Database Repository
// Direct access layer for shipping methods, zones, and tax rates
// ═══════════════════════════════════════════════════════════════

import { prisma } from '../../config/database';
import { ShippingMethod, ShippingZone, TaxRate } from '@prisma/client';

export class ShippingRepository {
  async findActiveMethods(): Promise<ShippingMethod[]> {
    return prisma.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findZonesForMethod(methodId: string): Promise<ShippingZone[]> {
    return prisma.shippingZone.findMany({
      where: { methodId },
    });
  }

  /**
   * Find matching tax rates based on country and optional state
   */
  async findMatchingTaxRates(country: string, state?: string | null): Promise<TaxRate[]> {
    return prisma.taxRate.findMany({
      where: {
        country: { equals: country, mode: 'insensitive' },
        OR: [
          { state: { equals: state || undefined, mode: 'insensitive' } },
          { state: null },
        ],
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });
  }
}
