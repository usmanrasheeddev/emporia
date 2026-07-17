// ═══════════════════════════════════════════════════════════════
// Express Application Entry
// Configures middlewares, security headers, routers, and error handlers
// ═══════════════════════════════════════════════════════════════

import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import passport from 'passport';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { corsMiddleware } from './middleware/cors.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { ApiError } from './utils/api-error';
import { apiLimiter } from './middleware/rate-limit.middleware';
import { initializePassport } from './config/passport';

// Router Imports
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import categoryRoutes from './modules/category/category.routes';
import brandRoutes from './modules/brand/brand.routes';
import productRoutes from './modules/product/product.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import searchRoutes from './modules/search/search.routes';
import reviewRoutes from './modules/review/review.routes';
import cartRoutes from './modules/cart/cart.routes';
import couponRoutes from './modules/coupon/coupon.routes';
import shippingRoutes from './modules/shipping/shipping.routes';
import orderRoutes from './modules/order/order.routes';
import paymentRoutes from './modules/payment/payment.routes';
import ticketRoutes from './modules/support/ticket.routes';

const app = express();

// ─── Global Middlewares ──────────────────────────────────────

app.use(helmet());
app.use(corsMiddleware);
app.use(compression());
app.use(cookieParser());

// Custom JSON body parser to verify raw body for Stripe signatures
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, res, buf) => {
      if (req.originalUrl.includes('/webhook')) {
        req.rawBody = buf;
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Passport Authentication ────────────────────────────────

app.use(passport.initialize());
initializePassport();

// ─── API Routes ──────────────────────────────────────────────

// Apply rate limiter to all API endpoints
app.use('/api', apiLimiter);

// Mounted Feature Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/shipping', shippingRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/tickets', ticketRoutes);

// Swagger API Documentation UI
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NexaStore REST API Spec',
      version: '1.0.0',
      description: 'API documentation for the NexaStore e-commerce backend platform',
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './dist/modules/**/*.routes.js'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// ─── Error Handling ──────────────────────────────────────────

// 404 handler for unmatched routes
app.use((req, res, next) => {
  next(ApiError.notFound(`Endpoint ${req.method} ${req.originalUrl} not found`));
});

// Global error handler (must be last)
app.use(errorMiddleware);

export default app;
