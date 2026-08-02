import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate request input — length-limits strings and blocks obvious XSS payloads.
 * Drizzle ORM parameterizes all queries so SQL injection protection is handled
 * at the DB layer; this is a lightweight first-pass filter only.
 */
export function validateInput(req: Request, res: Response, next: NextFunction) {
  // AI endpoints handle free-form natural language — skip pattern matching for them
  const aiEndpoints = [
    '/api/goals/ai-create',
    '/api/goals/ai-delete',
    '/api/goals/ai-progress',
    '/api/ai-coach',
    '/api/financial-insights'
  ];

  if (aiEndpoints.some(endpoint => req.path === endpoint)) {
    return next();
  }

  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      // Reset regex lastIndex to avoid stateful false-positives across calls
      return xssPatterns.some(pattern => { pattern.lastIndex = 0; return pattern.test(value); });
    }
    if (Array.isArray(value)) return value.some(checkValue);
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    return res.status(400).json({ error: 'Invalid input detected' });
  }

  next();
}

/**
 * Validate session integrity — called on protected routes.
 */
export function validateSession(req: any, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    const user = req.user;
    if (user && user.isActive !== false) {
      return next();
    }
  }
  return res.status(401).json({ error: 'Session invalid or expired' });
}

/**
 * Log a security event with the real request IP (respecting trust proxy).
 * Pass `req` when called from a middleware/route that has the request object.
 */
export function logSecurityEvent(eventType: string, userId?: number, details?: any, req?: Request) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    userId: userId ?? 'anonymous',
    details: details ?? {},
    ip: req?.ip ?? 'unknown',
  };
  console.log('SECURITY_EVENT:', JSON.stringify(logEntry));
}

/**
 * Content-type guard for state-changing requests.
 * NOTE: this is NOT a CSRF token check — it only ensures the client sends JSON.
 * It prevents cross-origin form submissions but does not protect against
 * CSRF from origins that can set Content-Type: application/json.
 * A full CSRF token is the correct fix; this is retained as a low-cost filter.
 */
export function enforceJsonContentType(req: Request, res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({ error: 'Invalid content type' });
    }
  }
  next();
}

// Backwards-compatible alias so existing imports don't break
export const csrfProtection = enforceJsonContentType;

/**
 * Sanitize user input — trims strings, caps length, clamps numbers.
 * Only handles top-level object keys and strings/numbers.
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().substring(0, 1000);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        sanitized[key] = value.trim().substring(0, 1000);
      } else if (typeof value === 'number') {
        sanitized[key] = Math.max(-1e10, Math.min(1e10, value));
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return input;
}
