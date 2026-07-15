// ═══════════════════════════════════════════════════════════════
// Request Validation Middleware
// Validates request body, params, or query against Zod schemas
// ═══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export type ValidationSource = 'body' | 'query' | 'params';

/**
 * Validates request data against a Zod schema and updates the request object with parsed values
 */
export function validate(schema: AnyZodObject, source: ValidationSource = 'body') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      // Mutate request with fully typed, parsed, and sanitized Zod output
      req[source] = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };
}
