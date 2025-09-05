import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Generate a secure random token
 * @param length Token length in bytes
 * @returns Hex string token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate request input to prevent injection attacks
 */
export function validateInput(req: Request, res: Response, next: NextFunction) {
  // Skip validation for AI endpoints that handle natural language
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

  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /(union|select|insert|delete|update|drop|create|alter)\s+/gi
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
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
 * Middleware to validate session integrity
 */
export function validateSession(req: any, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    const user = req.user;
    
    // Check if user account is still active
    if (user && user.isActive !== false) {
      return next();
    }
  }
  
  return res.status(401).json({ error: 'Session invalid or expired' });
}

/**
 * Middleware to log security events
 */
export function logSecurityEvent(eventType: string, userId?: number, details?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    eventType,
    userId: userId || 'anonymous',
    details: details || {},
    ip: 'masked' // In production, log IP addresses for security monitoring
  };
  
  console.log('SECURITY_EVENT:', JSON.stringify(logEntry));
}

/**
 * Middleware to prevent CSRF attacks on state-changing operations
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // For state-changing operations, ensure proper content-type
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({ error: 'Invalid content type' });
    }
  }
  
  next();
}

/**
 * Sanitize user input for database operations
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().substring(0, 1000); // Limit string length
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'string') {
        sanitized[key] = value.trim().substring(0, 1000);
      } else if (typeof value === 'number') {
        sanitized[key] = Math.max(-1e10, Math.min(1e10, value)); // Limit number range
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  return input;
}