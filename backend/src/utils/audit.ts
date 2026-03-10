import { query } from '../config/database';
import { logger } from './logger';

export async function logAudit(
  eventType: string,
  actor: string,
  resourceType?: string,
  resourceId?: string,
  payload?: Record<string, any>,
  ipAddress?: string
) {
  try {
    await query(
      `INSERT INTO audit_logs (event_type, actor, resource_type, resource_id, payload, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [eventType, actor, resourceType || null, resourceId || null, JSON.stringify(payload || {}), ipAddress || null]
    );
  } catch (err: any) {
    logger.error('Failed to write audit log', { eventType, error: err.message });
  }
}
