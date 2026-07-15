// ═══════════════════════════════════════════════════════════════
// CORS Configuration Middleware
// Sets up cross-origin resource sharing permissions
// ═══════════════════════════════════════════════════════════════

import cors from 'cors';
import { env } from '../config/env';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
});
