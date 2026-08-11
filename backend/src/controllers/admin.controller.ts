import { Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/db';
import { AuditService } from '../services/audit.service';
import { EmailService } from '../services/email.service';
import { EncryptionService } from '../services/encryption.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler.middleware';

export class AdminController {
  /**
   * Get all users (admin only)
   */
  static async getUsers(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await query('SELECT COUNT(*) FROM users');
      const total = parseInt(countResult.rows[0].count);

      // Get users
      const result = await query(
        `SELECT id, username, full_name, email, role, auth_provider, is_active, created_by, created_at, updated_at, last_login
         FROM users
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      res.json({
        success: true,
        data: {
          data: result.rows,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      throw new AppError('Failed to get users', 500);
    }
  }

  /**
   * Create a new user (admin only)
   */
  static async createUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { username, full_name, email, password, role, auth_provider } = req.body;
      const provider = auth_provider || 'local';

      // Validate role
      if (!['admin', 'user', 'external'].includes(role)) {
        throw new AppError('Invalid role', 400);
      }

      // Validate auth_provider
      if (!['local', 'google', 'both'].includes(provider)) {
        throw new AppError('Invalid auth provider', 400);
      }

      // Determine if this is an external user (non-tymeglobal.com, local/both auth)
      const emailDomain = email.split('@')[1]?.toLowerCase();
      const internalDomain = (process.env.ALLOWED_SSO_DOMAIN || 'tymeglobal.com').toLowerCase();
      const isExternalUser = emailDomain !== internalDomain && provider !== 'google';

      // Internal/Google users don't need a password; external users get a setup email
      if (!isExternalUser && provider !== 'google' && !password) {
        throw new AppError('Password is required for local authentication', 400);
      }

      // Check if username or email already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        throw new AppError('Username or email already exists', 400);
      }

      // Hash password if provided (not set for external users)
      const passwordHash = password ? await bcrypt.hash(password, 12) : null;

      // Generate setup token for external users
      const setupToken = isExternalUser ? uuidv4() : null;
      const setupExpires = isExternalUser
        ? new Date(Date.now() + 24 * 60 * 60 * 1000)
        : null;

      // Create user
      const result = await query(
        `INSERT INTO users (username, full_name, email, password_hash, role, auth_provider, created_by, password_setup_token, password_setup_expires)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, username, full_name, email, role, auth_provider, is_active, created_by, created_at, updated_at`,
        [username, full_name || null, email, passwordHash, role, provider, req.user.userId, setupToken, setupExpires]
      );

      // Send setup email to external users. The user row above is already
      // committed, so an email failure here must not surface as a hard
      // failure -- otherwise the admin sees "failed" but retrying then hits
      // the existing-user check above for a row that was actually created.
      let emailFailed = false;
      if (isExternalUser && setupToken) {
        try {
          const displayName = full_name || username;
          await EmailService.sendPasswordSetupEmail(email, displayName, setupToken);
        } catch (emailError) {
          console.error('Failed to send setup email:', emailError);
          emailFailed = true;
        }
      }

      res.status(201).json({
        success: true,
        data: result.rows[0],
        ...(emailFailed && {
          warning: 'User created, but the setup email failed to send. Share the password setup link with them manually or contact IT about SMTP.',
        }),
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Create user error:', error);
      throw new AppError('Failed to create user', 500);
    }
  }

  /**
   * Bulk create users from an imported list (admin only)
   */
  static async bulkCreateUsers(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { entries } = req.body;

      if (!Array.isArray(entries) || entries.length === 0) {
        throw new AppError('entries must be a non-empty array', 400);
      }

      if (entries.length > 500) {
        throw new AppError('Maximum 500 entries per import', 400);
      }

      const internalDomain = (process.env.ALLOWED_SSO_DOMAIN || 'tymeglobal.com').toLowerCase();
      const results: Array<{ index: number; username: string; email: string; success: boolean; id?: string; error?: string }> = [];

      // Processed sequentially (not Promise.all) so duplicate username/email checks
      // stay correct even when the same value appears twice within one CSV.
      for (let index = 0; index < entries.length; index++) {
        const entry = entries[index] || {};
        const username = String(entry.username || '').trim();
        const email = String(entry.email || '').trim();
        const full_name = entry.full_name ? String(entry.full_name).trim() : null;
        const role = ['admin', 'user', 'external'].includes(entry.role) ? entry.role : 'user';
        const provider = ['local', 'google', 'both'].includes(entry.auth_provider) ? entry.auth_provider : 'local';
        const password = entry.password ? String(entry.password) : undefined;

        if (!username || !email) {
          results.push({ index, username, email, success: false, error: 'Username and email are required' });
          continue;
        }

        try {
          const emailDomain = email.split('@')[1]?.toLowerCase();
          const isExternalUser = emailDomain !== internalDomain && provider !== 'google';

          if (!isExternalUser && provider !== 'google' && !password) {
            results.push({ index, username, email, success: false, error: 'Password is required for local authentication' });
            continue;
          }

          const existingUser = await query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
          );

          if (existingUser.rows.length > 0) {
            results.push({ index, username, email, success: false, error: 'Username or email already exists' });
            continue;
          }

          const passwordHash = password ? await bcrypt.hash(password, 12) : null;
          const setupToken = isExternalUser ? uuidv4() : null;
          const setupExpires = isExternalUser
            ? new Date(Date.now() + 24 * 60 * 60 * 1000)
            : null;

          const inserted = await query(
            `INSERT INTO users (username, full_name, email, password_hash, role, auth_provider, created_by, password_setup_token, password_setup_expires)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`,
            [username, full_name, email, passwordHash, role, provider, req.user.userId, setupToken, setupExpires]
          );

          if (isExternalUser && setupToken) {
            try {
              await EmailService.sendPasswordSetupEmail(email, full_name || username, setupToken);
            } catch (emailError) {
              console.error('Failed to send setup email during bulk import:', emailError);
            }
          }

          results.push({ index, username, email, success: true, id: inserted.rows[0].id });
        } catch (rowError) {
          console.error('Bulk create user row error:', rowError);
          results.push({ index, username, email, success: false, error: 'Failed to create user' });
        }
      }

      res.status(201).json({ success: true, data: { results } });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Bulk create users error:', error);
      throw new AppError('Failed to bulk create users', 500);
    }
  }

  /**
   * Update a user (admin only)
   */
  static async updateUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { username, full_name, email, password, role, is_active } = req.body;

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (username !== undefined) {
        updates.push(`username = $${paramIndex++}`);
        values.push(username);
      }

      if (full_name !== undefined) {
        updates.push(`full_name = $${paramIndex++}`);
        values.push(full_name);
      }

      if (email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(email);
      }

      if (password !== undefined) {
        const passwordHash = await bcrypt.hash(password, 12);
        updates.push(`password_hash = $${paramIndex++}`);
        values.push(passwordHash);
      }

      if (role !== undefined) {
        if (!['admin', 'user', 'external'].includes(role)) {
          throw new AppError('Invalid role', 400);
        }
        updates.push(`role = $${paramIndex++}`);
        values.push(role);
      }

      if (is_active !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(is_active);
      }

      if (updates.length === 0) {
        throw new AppError('No fields to update', 400);
      }

      values.push(id);

      const result = await query(
        `UPDATE users
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING id, username, full_name, email, role, auth_provider, is_active, created_by, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Update user error:', error);
      throw new AppError('Failed to update user', 500);
    }
  }

  /**
   * Preview the passwords a transfer would move, flagging ones that look like
   * duplicates (same title + same decrypted password) either against another
   * password the source user already owns, or against one the target user
   * already owns. Only active passwords are shown -- soft-deleted ones are
   * always carried along by transferPasswords regardless of selection, since
   * the admin has no way to review something they can't see.
   */
  static async getTransferPreview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const targetUserId = req.query.targetUserId as string;

      if (id === targetUserId) {
        throw new AppError('Source and target user must be different', 400);
      }

      const [sourceResult, targetResult] = await Promise.all([
        query(
          `SELECT id, guid, title, encrypted_password, encryption_iv, updated_at
           FROM passwords WHERE created_by = $1 AND is_active = true ORDER BY title`,
          [id]
        ),
        query(
          `SELECT title, encrypted_password, encryption_iv
           FROM passwords WHERE created_by = $1 AND is_active = true`,
          [targetUserId]
        ),
      ]);

      const decrypt = (encrypted: string, iv: string): string | null => {
        try {
          return EncryptionService.decrypt(encrypted, iv);
        } catch {
          return null;
        }
      };
      const normalizeTitle = (title: string | null) => (title || '').trim().toLowerCase();

      const sourceDecrypted = sourceResult.rows.map((row) => ({
        ...row,
        titleNorm: normalizeTitle(row.title),
        plainPassword: decrypt(row.encrypted_password, row.encryption_iv),
      }));

      const targetDecrypted = targetResult.rows.map((row) => ({
        titleNorm: normalizeTitle(row.title),
        plainPassword: decrypt(row.encrypted_password, row.encryption_iv),
      }));

      const items = sourceDecrypted.map((row, index) => {
        const matchesTarget = targetDecrypted.some(
          (t) => t.plainPassword !== null && t.plainPassword === row.plainPassword && t.titleNorm === row.titleNorm
        );
        const matchesSource = sourceDecrypted.some(
          (other, otherIndex) =>
            otherIndex !== index &&
            other.plainPassword !== null &&
            other.plainPassword === row.plainPassword &&
            other.titleNorm === row.titleNorm
        );

        return {
          id: row.id,
          guid: row.guid,
          title: row.title,
          updated_at: row.updated_at,
          duplicate: matchesTarget || matchesSource,
          duplicateReason: matchesTarget ? 'target' : matchesSource ? 'source' : undefined,
        };
      });

      res.json({ success: true, data: { items } });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Transfer preview error:', error);
      throw new AppError('Failed to load transfer preview', 500);
    }
  }

  /**
   * Transfer passwords owned by one user to another user (admin only).
   * Intended for offboarding: deleting a user hard-deletes their passwords
   * (passwords.created_by has ON DELETE CASCADE), so ownership must be
   * reassigned first to preserve them.
   *
   * If passwordIds is provided, only those (plus any already-inactive
   * passwords, which aren't shown in the review UI) are moved -- this lets an
   * admin exclude entries flagged as duplicates. If omitted, every password
   * owned by the source user is transferred.
   */
  static async transferPasswords(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { targetUserId, passwordIds } = req.body;

      if (id === targetUserId) {
        throw new AppError('Source and target user must be different', 400);
      }

      if (passwordIds !== undefined && !Array.isArray(passwordIds)) {
        throw new AppError('passwordIds must be an array', 400);
      }

      const usersResult = await query(
        'SELECT id, username FROM users WHERE id IN ($1, $2)',
        [id, targetUserId]
      );

      const sourceUser = usersResult.rows.find((u) => u.id === id);
      const targetUser = usersResult.rows.find((u) => u.id === targetUserId);

      if (!sourceUser) {
        throw new AppError('Source user not found', 404);
      }
      if (!targetUser) {
        throw new AppError('Target user not found', 404);
      }

      const result = Array.isArray(passwordIds)
        ? await query(
            `UPDATE passwords
             SET created_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE created_by = $2 AND (is_active = false OR id = ANY($3::uuid[]))
             RETURNING id`,
            [targetUserId, id, passwordIds]
          )
        : await query(
            `UPDATE passwords
             SET created_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE created_by = $2
             RETURNING id`,
            [targetUserId, id]
          );

      res.json({
        success: true,
        data: {
          transferred: result.rows.length,
          fromUser: sourceUser.username,
          toUser: targetUser.username,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Transfer passwords error:', error);
      throw new AppError('Failed to transfer passwords', 500);
    }
  }

  /**
   * Delete a user (admin only)
   */
  static async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Don't allow deleting self
      if (req.user?.userId === id) {
        throw new AppError('Cannot delete your own account', 400);
      }

      const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

      if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Delete user error:', error);
      throw new AppError('Failed to delete user', 500);
    }
  }

  /**
   * Get access logs (admin only)
   */
  static async getAccessLogs(req: AuthRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const passwordId = req.query.passwordId as string;
      const userId = req.query.userId as string;
      const accessType = req.query.accessType as any;

      const logs = await AuditService.getAccessLogs({
        page,
        limit,
        passwordId,
        userId,
        accessType,
      });

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      throw new AppError('Failed to get access logs', 500);
    }
  }

  /**
   * Get statistics (admin only)
   */
  static async getStatistics(req: AuthRequest, res: Response) {
    try {
      const stats = await AuditService.getStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      throw new AppError('Failed to get statistics', 500);
    }
  }
}
