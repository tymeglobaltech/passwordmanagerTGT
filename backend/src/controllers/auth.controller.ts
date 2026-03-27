import { Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../database/db';
import { JWTService } from '../services/jwt.service';
import { GoogleAuthService } from '../services/google.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/errorHandler.middleware';

export class AuthController {
  /**
   * User login
   */
  static async login(req: AuthRequest, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        throw new AppError('Invalid credentials', 401);
      }

      const user = result.rows[0];

      // Check if user is active
      if (!user.is_active) {
        throw new AppError('Account is deactivated', 403);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        throw new AppError('Invalid credentials', 401);
      }

      // Update last login
      await query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Generate JWT token
      const token = JWTService.generateToken({
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });

      // Return user data (without password hash)
      const { password_hash, ...userData } = user;

      res.json({
        success: true,
        data: {
          token,
          user: userData,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Login failed', 500);
    }
  }

  /**
   * Google SSO login
   */
  static async googleLogin(req: AuthRequest, res: Response) {
    try {
      const { idToken } = req.body;

      // Verify the Google ID token and extract user info
      const googlePayload = await GoogleAuthService.verifyIdToken(idToken);

      // Look up user by email
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [googlePayload.email]
      );

      if (result.rows.length === 0) {
        throw new AppError('Account not found. Contact your administrator.', 403);
      }

      const user = result.rows[0];

      if (!user.is_active) {
        throw new AppError('Account is deactivated', 403);
      }

      // If user was local-only, upgrade to 'both' and store google_id
      if (user.auth_provider === 'local') {
        await query(
          'UPDATE users SET auth_provider = $1, google_id = $2, last_login = CURRENT_TIMESTAMP WHERE id = $3',
          ['both', googlePayload.googleId, user.id]
        );
        user.auth_provider = 'both';
      } else {
        // Update google_id if not set, and update last_login
        await query(
          'UPDATE users SET google_id = COALESCE(google_id, $1), last_login = CURRENT_TIMESTAMP WHERE id = $2',
          [googlePayload.googleId, user.id]
        );
      }

      // Generate JWT token
      const token = JWTService.generateToken({
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });

      // Return user data (without password hash)
      const { password_hash, ...userData } = user;

      res.json({
        success: true,
        data: {
          token,
          user: userData,
        },
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      // Surface domain mismatch and token errors as 403
      if (error instanceof Error && error.message.includes('accounts are allowed')) {
        throw new AppError(error.message, 403);
      }
      throw new AppError('Google authentication failed', 500);
    }
  }

  /**
   * Get current user info
   */
  static async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const result = await query(
        'SELECT id, username, email, role, auth_provider, is_active, created_at, updated_at, last_login FROM users WHERE id = $1',
        [req.user.userId]
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
      throw new AppError('Failed to get user info', 500);
    }
  }

  /**
   * Set password via setup token (external user onboarding)
   */
  static async setPassword(req: AuthRequest, res: Response) {
    try {
      const { token, password } = req.body;

      const result = await query(
        `SELECT id FROM users
         WHERE password_setup_token = $1
           AND password_setup_expires > CURRENT_TIMESTAMP
           AND is_active = true`,
        [token]
      );

      if (result.rows.length === 0) {
        throw new AppError('Invalid or expired setup link', 400);
      }

      const userId = result.rows[0].id;
      const passwordHash = await bcrypt.hash(password, 12);

      await query(
        `UPDATE users
         SET password_hash = $1, password_setup_token = NULL, password_setup_expires = NULL
         WHERE id = $2`,
        [passwordHash, userId]
      );

      res.json({ success: true, message: 'Password set successfully. You can now log in.' });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to set password', 500);
    }
  }

  /**
   * Logout (client-side token removal)
   */
  static async logout(req: AuthRequest, res: Response) {
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}
