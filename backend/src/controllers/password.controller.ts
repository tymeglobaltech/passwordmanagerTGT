import { Response } from 'express';
import { query } from '../database/db';
import { EncryptionService } from '../services/encryption.service';
import { AuditService } from '../services/audit.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler.middleware';
import { PasswordGeneratorOptions } from '@passwordpal/shared';

export class PasswordController {
  /**
   * Generate a secure password
   */
  static generatePassword(req: AuthRequest, res: Response) {
    const options: PasswordGeneratorOptions = {
      length: req.body.length || 16,
      uppercase: req.body.uppercase !== false,
      lowercase: req.body.lowercase !== false,
      numbers: req.body.numbers !== false,
      symbols: req.body.symbols !== false,
    };

    // Build character set
    let charset = '';
    if (options.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (options.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (options.numbers) charset += '0123456789';
    if (options.symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (charset.length === 0) {
      throw new AppError('At least one character type must be selected', 400);
    }

    // Generate password
    let password = '';
    const randomValues = new Uint32Array(options.length);
    require('crypto').webcrypto.getRandomValues(randomValues);

    for (let i = 0; i < options.length; i++) {
      password += charset[randomValues[i] % charset.length];
    }

    // Calculate strength
    let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
    if (options.length >= 16 && charset.length >= 52) {
      strength = 'strong';
    } else if (options.length >= 12 && charset.length >= 36) {
      strength = 'good';
    } else if (options.length >= 8) {
      strength = 'fair';
    }

    res.json({
      success: true,
      data: {
        password,
        strength,
      },
    });
  }

  /**
   * Save a password and get shareable link
   */
  static async savePassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { password, title, expires_at, max_access_count } = req.body;

      if (!password) {
        throw new AppError('Password is required', 400);
      }

      // Encrypt password
      const { encrypted, iv } = EncryptionService.encrypt(password);
      const guid = EncryptionService.generateGuid();

      // Save to database
      const result = await query(
        `INSERT INTO passwords (guid, encrypted_password, encryption_iv, title, created_by, expires_at, max_access_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, guid, title, created_at, expires_at, max_access_count`,
        [guid, encrypted, iv, title || null, req.user.userId, expires_at || null, max_access_count || null]
      );

      const savedPassword = result.rows[0];

      // Log creation
      await AuditService.logAccess({
        passwordId: savedPassword.id,
        accessedBy: req.user.userId,
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        accessType: 'create',
        success: true,
      });

      // Generate shareable link
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const shareableLink = `${frontendUrl}/retrieve/${savedPassword.guid}`;

      res.json({
        success: true,
        data: {
          ...savedPassword,
          shareable_link: shareableLink,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Save password error:', error);
      throw new AppError('Failed to save password', 500);
    }
  }

  /**
   * Retrieve password by GUID
   */
  static async retrievePassword(req: AuthRequest, res: Response) {
    try {
      const { guid } = req.params;

      // Find password
      const result = await query(
        `SELECT id, guid, encrypted_password, encryption_iv, title, expires_at,
                max_access_count, current_access_count, is_active, created_at
         FROM passwords
         WHERE guid = $1`,
        [guid]
      );

      if (result.rows.length === 0) {
        throw new AppError('Password not found', 404);
      }

      const passwordRecord = result.rows[0];

      // Check if active
      if (!passwordRecord.is_active) {
        throw new AppError('This password has been deleted', 410);
      }

      // Check expiration
      if (passwordRecord.expires_at && new Date(passwordRecord.expires_at) < new Date()) {
        throw new AppError('This password has expired', 410);
      }

      // Check access limit
      if (
        passwordRecord.max_access_count &&
        passwordRecord.current_access_count >= passwordRecord.max_access_count
      ) {
        throw new AppError('This password has reached its access limit', 410);
      }

      // Decrypt password
      const decryptedPassword = EncryptionService.decrypt(
        passwordRecord.encrypted_password,
        passwordRecord.encryption_iv
      );

      // Increment access count
      await query(
        'UPDATE passwords SET current_access_count = current_access_count + 1 WHERE id = $1',
        [passwordRecord.id]
      );

      // Log access
      await AuditService.logAccess({
        passwordId: passwordRecord.id,
        accessedBy: req.user?.userId,
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        accessType: 'view',
        success: true,
      });

      // Calculate remaining accesses
      const remainingAccesses = passwordRecord.max_access_count
        ? passwordRecord.max_access_count - passwordRecord.current_access_count - 1
        : undefined;

      res.json({
        success: true,
        data: {
          password: decryptedPassword,
          title: passwordRecord.title,
          created_at: passwordRecord.created_at,
          expires_at: passwordRecord.expires_at,
          max_access_count: passwordRecord.max_access_count,
          current_access_count: passwordRecord.current_access_count + 1,
          remaining_accesses: remainingAccesses,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Retrieve password error:', error);
      throw new AppError('Failed to retrieve password', 500);
    }
  }

  /**
   * List user's passwords
   */
  static async listPasswords(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Get total count
      const countResult = await query(
        'SELECT COUNT(*) FROM passwords WHERE created_by = $1 AND is_active = true',
        [req.user.userId]
      );
      const total = parseInt(countResult.rows[0].count);

      // Get passwords
      const result = await query(
        `SELECT id, guid, title, created_at, expires_at, max_access_count, current_access_count, is_active
         FROM passwords
         WHERE created_by = $1 AND is_active = true
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user.userId, limit, offset]
      );

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      const passwords = result.rows.map(p => ({
        ...p,
        shareable_link: `${frontendUrl}/retrieve/${p.guid}`,
      }));

      res.json({
        success: true,
        data: {
          data: passwords,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('List passwords error:', error);
      throw new AppError('Failed to list passwords', 500);
    }
  }

  /**
   * Delete password
   */
  static async deletePassword(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const { guid } = req.params;

      // Find password
      const result = await query(
        'SELECT id, created_by FROM passwords WHERE guid = $1',
        [guid]
      );

      if (result.rows.length === 0) {
        throw new AppError('Password not found', 404);
      }

      const passwordRecord = result.rows[0];

      // Check ownership
      if (passwordRecord.created_by !== req.user.userId) {
        throw new AppError('Unauthorized', 403);
      }

      // Soft delete
      await query(
        'UPDATE passwords SET is_active = false WHERE id = $1',
        [passwordRecord.id]
      );

      // Log deletion
      await AuditService.logAccess({
        passwordId: passwordRecord.id,
        accessedBy: req.user.userId,
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        accessType: 'delete',
        success: true,
      });

      res.json({
        success: true,
        message: 'Password deleted successfully',
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('Delete password error:', error);
      throw new AppError('Failed to delete password', 500);
    }
  }
}
