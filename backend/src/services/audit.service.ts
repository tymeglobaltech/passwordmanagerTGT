import { AccessType, AdminAuditAction } from '@passwordpal/shared';
import { query } from '../database/db';

export class AuditService {
  /**
   * Log password access
   */
  static async logAccess(data: {
    passwordId: string;
    accessedBy?: string;
    ipAddress: string;
    userAgent: string;
    accessType: AccessType;
    success: boolean;
  }): Promise<void> {
    try {
      await query(
        `INSERT INTO access_logs (password_id, accessed_by, ip_address, user_agent, access_type, success)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          data.passwordId,
          data.accessedBy || null,
          data.ipAddress,
          data.userAgent,
          data.accessType,
          data.success,
        ]
      );
    } catch (error) {
      console.error('Failed to log access:', error);
      // Don't throw - logging failure shouldn't break the main operation
    }
  }

  /**
   * Get access logs with pagination and filtering
   */
  static async getAccessLogs(options: {
    page?: number;
    limit?: number;
    passwordId?: string;
    userId?: string;
    accessType?: AccessType;
    startDate?: Date;
    endDate?: Date;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (options.passwordId) {
      whereConditions.push(`password_id = $${paramIndex++}`);
      params.push(options.passwordId);
    }

    if (options.userId) {
      whereConditions.push(`accessed_by = $${paramIndex++}`);
      params.push(options.userId);
    }

    if (options.accessType) {
      whereConditions.push(`access_type = $${paramIndex++}`);
      params.push(options.accessType);
    }

    if (options.startDate) {
      whereConditions.push(`created_at >= $${paramIndex++}`);
      params.push(options.startDate);
    }

    if (options.endDate) {
      whereConditions.push(`created_at <= $${paramIndex++}`);
      params.push(options.endDate);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM access_logs ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get logs
    const logsResult = await query(
      `SELECT al.*, u.username, p.title as password_title
       FROM access_logs al
       LEFT JOIN users u ON al.accessed_by = u.id
       LEFT JOIN passwords p ON al.password_id = p.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    return {
      data: logsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Log an admin action on a user account (role change, activation,
   * creation, deletion, password transfer). Failure to log must not block
   * the underlying action, same as logAccess.
   */
  static async logAdminAction(data: {
    actorId?: string;
    action: AdminAuditAction;
    targetUserId?: string;
    details?: Record<string, any>;
    ipAddress: string;
    userAgent: string;
  }): Promise<void> {
    try {
      await query(
        `INSERT INTO admin_audit_log (actor_id, action, target_user_id, details, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          data.actorId || null,
          data.action,
          data.targetUserId || null,
          data.details ? JSON.stringify(data.details) : null,
          data.ipAddress,
          data.userAgent,
        ]
      );
    } catch (error) {
      console.error('Failed to log admin action:', error);
      // Don't throw - logging failure shouldn't break the main operation
    }
  }

  /**
   * Get admin audit log entries with pagination and filtering
   */
  static async getAdminAuditLog(options: {
    page?: number;
    limit?: number;
    actorId?: string;
    targetUserId?: string;
    action?: AdminAuditAction;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (options.actorId) {
      whereConditions.push(`actor_id = $${paramIndex++}`);
      params.push(options.actorId);
    }

    if (options.targetUserId) {
      whereConditions.push(`target_user_id = $${paramIndex++}`);
      params.push(options.targetUserId);
    }

    if (options.action) {
      whereConditions.push(`action = $${paramIndex++}`);
      params.push(options.action);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM admin_audit_log ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const logsResult = await query(
      `SELECT aal.*, actor.username AS actor_username, target.username AS target_username
       FROM admin_audit_log aal
       LEFT JOIN users actor ON aal.actor_id = actor.id
       LEFT JOIN users target ON aal.target_user_id = target.id
       ${whereClause}
       ORDER BY aal.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    return {
      data: logsResult.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get statistics for admin dashboard
   */
  static async getStatistics() {
    // Total and active users
    const usersResult = await query(
      `SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users
       FROM users`
    );

    // Total and active passwords
    const passwordsResult = await query(
      `SELECT
        COUNT(*) as total_passwords,
        COUNT(*) FILTER (WHERE is_active = true) as active_passwords
       FROM passwords`
    );

    // Access counts
    const accessesResult = await query(
      `SELECT
        COUNT(*) as total_accesses,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as accesses_today,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as accesses_this_week,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as accesses_this_month
       FROM access_logs`
    );

    return {
      total_users: parseInt(usersResult.rows[0].total_users),
      active_users: parseInt(usersResult.rows[0].active_users),
      total_passwords: parseInt(passwordsResult.rows[0].total_passwords),
      active_passwords: parseInt(passwordsResult.rows[0].active_passwords),
      total_accesses: parseInt(accessesResult.rows[0].total_accesses),
      accesses_today: parseInt(accessesResult.rows[0].accesses_today),
      accesses_this_week: parseInt(accessesResult.rows[0].accesses_this_week),
      accesses_this_month: parseInt(accessesResult.rows[0].accesses_this_month),
    };
  }
}
