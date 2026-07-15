// ═══════════════════════════════════════════════════════════════
// Async Handler Wrapper
// Eliminates the need for try/catch blocks in Express controllers
// ═══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction, RequestHandler } from 'express';

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
