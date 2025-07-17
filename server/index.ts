import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { startScheduler, stopScheduler } from "./scheduler";
import { validateEnvironment } from "./envValidation";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";

// Validate environment on startup
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
    ? ['https://mindmymoney.replit.app', /\.replit\.app$/, /\.replit\.co$/] // Allow Replit domains
    : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth attempts per windowMs
  message: { error: 'Too many authentication attempts, please try again later.' },
  skipSuccessfulRequests: true,
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Import storage to create a test user
import { storage } from "./storage";
import { testDatabaseConnection } from "./db";

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Test database connection first
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error('Failed to connect to database, exiting...');
    process.exit(1);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    // Start the notification scheduler
    startScheduler();
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    stopScheduler();
    server.close(() => {
      console.log('Process terminated');
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    stopScheduler();
    server.close(() => {
      console.log('Process terminated');
    });
  });
})();
