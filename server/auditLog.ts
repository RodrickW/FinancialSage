import { db } from './db';
import { pgTable, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

// Audit log table for security events
export const auditLogs = pgTable('audit_logs', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id'),
  eventType: text('event_type').notNull(),
  action: text('action').notNull(),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  details: jsonb('details'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  severity: text('severity').default('info'), // info, warning, error, critical
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Log security-related events for audit trail
 */
export async function logAuditEvent(event: {
  userId?: number;
  eventType: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}) {
  try {
    await db.insert(auditLogs).values({
      userId: event.userId,
      eventType: event.eventType,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      details: event.details,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      severity: event.severity || 'info',
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should not break application flow
  }
}

/**
 * Common audit event types
 */
export const AUDIT_EVENTS = {
  AUTH: {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    REGISTRATION: 'REGISTRATION',
    PASSWORD_RESET: 'PASSWORD_RESET',
  },
  DATA: {
    ACCOUNT_CREATED: 'ACCOUNT_CREATED',
    ACCOUNT_UPDATED: 'ACCOUNT_UPDATED',
    ACCOUNT_DELETED: 'ACCOUNT_DELETED',
    TRANSACTION_VIEWED: 'TRANSACTION_VIEWED',
    FINANCIAL_DATA_ACCESSED: 'FINANCIAL_DATA_ACCESSED',
  },
  SECURITY: {
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    PRIVILEGE_ESCALATION: 'PRIVILEGE_ESCALATION',
  },
  SUBSCRIPTION: {
    SUBSCRIPTION_CREATED: 'SUBSCRIPTION_CREATED',
    SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED',
    PAYMENT_PROCESSED: 'PAYMENT_PROCESSED',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
  }
} as const;