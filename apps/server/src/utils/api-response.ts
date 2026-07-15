// ═══════════════════════════════════════════════════════════════
// Standard API Response Formatter
// Formats all success and error responses consistently
// ═══════════════════════════════════════════════════════════════

import { PaginationMeta } from '@nexastore/shared';

export class ApiResponse<T = any> {
  public readonly success: boolean;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data?: T;
  public readonly meta?: PaginationMeta;

  constructor(statusCode: number, message: string, data?: T, meta?: PaginationMeta) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.statusCode = statusCode;
    this.message = message;
    if (data !== undefined) {
      this.data = data;
    }
    if (meta !== undefined) {
      this.meta = meta;
    }
  }

  static success<T = any>(message: string, data?: T, statusCode = 200, meta?: PaginationMeta): ApiResponse<T> {
    return new ApiResponse<T>(statusCode, message, data, meta);
  }

  static error(message: string, statusCode = 500, errors?: any[]): ApiResponse {
    const response = new ApiResponse(statusCode, message);
    if (errors) {
      (response as any).errors = errors;
    }
    return response;
  }
}
