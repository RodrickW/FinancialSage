import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startScheduler, stopScheduler } from "./scheduler";
import { validateEnvironment } from "./envValidation";
import { connectRedis, redisClient } from "./redis";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { RedisStore as RateLimitRedisStore } from "rate-limit-redis";
import cors from "cors";

// Validate environment on startup (hard-fails in production for critical vars)
validateEnvironment();

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow Vite HMR
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://replit.com", "https://cdn.plaid.com", "https://*.plaid.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://*.plaid.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://*.plaid.com"],
      connectSrc: ["'self'", "wss:", "https://api.stripe.com", "https://production.plaid.com", "https://*.plaid.com"],
      imgSrc: ["'self'", "data:", "https:", "https://*.plaid.com"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://*.plaid.com"],
      childSrc: ["'self'", "https://*.plaid.com"],
      formAction: ["'self'", "https://*.plaid.com"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://mindmymoney.replit.app', /\.replit\.app$/, /\.replit\.co$/, /mindmymoneyapp\.com/]
    : true,
  credentials: true
}));

// Health check endpoint (no rate limiting, no auth)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Stripe webhook needs raw body for signature verification — must come BEFORE express.json()
app.use('/api/webhook/stripe', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Request logging — only log status/timing, not response bodies (which can contain PII)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

import { storage } from "./storage";
import { testDatabaseConnection } from "./db";

(async () => {
  // 1. Connect to database
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database, exiting...');
    process.exit(1);
  }

  // 2. Connect to Redis (mandatory in production)
  await connectRedis();

  // 3. Set up rate limiters — use Redis store if Redis is available,
  //    otherwise fall back to in-memory (dev only)
  function makeStore() {
    if (redisClient.isReady) {
      return new RateLimitRedisStore({
        sendCommand: (...args: string[]) => (redisClient as any).sendCommand(args),
      });
    }
    return undefined; // express-rate-limit default (in-memory, dev only)
  }

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore(),
    skip: (req) =>
      req.path.startsWith('/assets/') ||
      req.path.startsWith('/static/') ||
      req.path === '/health' ||
      req.path === '/api/health',
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many authentication attempts, please try again later.' },
    skipSuccessfulRequests: true,
    store: makeStore(),
  });

  const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: { error: 'API rate limit exceeded. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
    store: makeStore(),
  });

  app.use('/api/', limiter);
  app.use('/api/auth/', authLimiter);
  app.use('/api/plaid/', apiLimiter);

  // 4. Register routes
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    // Never leak internal error details to the client
    const message = status < 500 ? (err.message || "Bad Request") : "Internal Server Error";
    if (status >= 500) {
      console.error(`Server error [${status}]:`, err);
    }
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // 5. Set up Vite (dev) or static serving (prod)
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // 6. Start listening
  const port = 5000;
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`serving on port ${port}`);
    startScheduler();
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down gracefully`);
    stopScheduler();
    server.close(() => {
      redisClient.quit().catch(() => {}).finally(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
})();
