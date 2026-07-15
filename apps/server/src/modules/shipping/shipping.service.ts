// ═══════════════════════════════════════════════════════════════
// Shipping & Tax Service Layer
// Business logic for shipping rates and country/state tax estimations
// ═══════════════════════════════════════════════════════════════

import { ShippingRepository } from './shipping.repository';
import { ApiError } from '../../utils/api-error';
import { prisma } from '../../config/database';

export class ShippingService {
  private repo: ShippingRepository;

  constructor(repo: ShippingRepository) {
    this.repo = repo;
  }

  async getActiveMethods() {
    return this.repo.findActiveMethods();
  }

  /**
   * Calculates shipping costs and tax estimations for checkout
   */
  async calculateShippingAndTax(
    userId?: string,
    input?: {
      addressId?: string | null;
      country?: string;
      state?: string | null;
      zipCode?: string | null;
      subtotal: number;
    }
  ) {
    let country = input?.country || 'US';
    let state = input?.state || null;
    let zipCode = input?.zipCode || null;
    const subtotal = input?.subtotal || 0;

    // 1. Resolve address if addressId provided
    if (userId && input?.addressId) {
      const address = await prisma.address.findFirst({
        where: { id: input.addressId, userId },
      });
      if (!address) throw ApiError.notFound('Address not found');
      country = address.country;
      state = address.state;
      zipCode = address.zipCode;
    }

    // 2. Calculate tax rate
    const taxRates = await this.repo.findMatchingTaxRates(country, state);
    // Grab the tax rate with highest priority
    const activeTaxRate = taxRates[0];
    const taxRatePercent = activeTaxRate ? Number(activeTaxRate.rate) : 0;
    const taxAmount = subtotal * taxRatePercent;

    // 3. Calculate shipping costs for each active method
    const methods = await this.repo.findActiveMethods();
    const shippingOptions = [];

    for (const method of methods) {
      let shippingRate = Number(method.baseRate);
      const zones = await this.repo.findZonesForMethod(method.id);

      // Check if destination matches any custom zone countries/states/zipcodes
      const matchingZone = zones.find((zone) => {
        const matchesCountry = zone.countries.some(
          (c) => c.toLowerCase() === country.toLowerCase()
        );
        const matchesState =
          zone.states.length === 0 ||
          (state && zone.states.some((s) => s.toLowerCase() === state.toLowerCase()));

        return matchesCountry && matchesState;
      });

      if (matchingZone) {
        shippingRate = Number(matchingZone.rate);
      }

      // Apply free shipping thresholds
      if (
        method.freeShippingThreshold &&
        subtotal >= Number(method.freeShippingThreshold)
      ) {
        shippingRate = 0;
      }

      shippingOptions.push({
        id: method.id,
        name: method.name,
        code: method.code,
        description: method.description,
        estimatedDays: method.estimatedDays,
        rate: shippingRate,
      });
    }

    return {
      destination: { country, state, zipCode },
      tax: {
        name: activeTaxRate?.name || 'No Tax',
        rate: taxRatePercent,
        amount: taxAmount,
      },
      shippingOptions,
    };
  }
}
