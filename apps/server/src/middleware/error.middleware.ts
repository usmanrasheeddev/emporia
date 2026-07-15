// ═══════════════════════════════════════════════════════════════
// Global Error Middleware
// Catches and formats all exceptions thrown in the application
// ═══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;

  // Convert raw errors to ApiError if they are not already
  if (!(error instanceof ApiError)) {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors: any[] = [];

    // Handle Zod Validation Errors
    if (error instanceof ZodError) {
      statusCode = 400;
      message = 'Validation Error';
      errors = error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
    }
    // Handle Prisma DB Errors
    else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002': // Unique constraint violation
          statusCode = 409;
          const targetField = (error.meta?.target as string[])?.join(', ') || 'fields';
          message = `Unique constraint violation: record with this ${targetField} already exists.`;
          break;
        case 'P2025': // Record not found
          statusCode = 404;
          message = error.meta?.cause as string || 'Record not found';
          break;
        default:
          statusCode = 400;
          message = `Database Error: ${error.message}`;
          break;
      }
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      statusCode = 400;
      message = 'Database validation failed';
    } else if (error.name === 'MulterError') {
      statusCode = 400;
      message = `File upload error: ${error.message}`;
    }

    error = new ApiError(statusCode, message, errors, err.stack);
  }

  // Log error using Winston
  if (error.statusCode >= 500) {
    logger.error(`${req.method} ${req.url} - Internal error:`, error);
  } else {
    logger.warn(`${req.method} ${req.url} - Client error [${error.statusCode}]: ${error.message}`);
  }

  // Response Payload
  const response: any = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
  };

  if (error.errors && error.errors.length > 0) {
    response.errors = error.errors;
  }

  if (env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};
