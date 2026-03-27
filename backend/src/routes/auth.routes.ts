import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { loginLimiter } from '../middleware/rateLimiter.middleware';
import { runValidations, validate } from '../middleware/validation.middleware';

const router = Router();

// Login
router.post(
  '/login',
  loginLimiter,
  runValidations([
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  validate,
  (req, res, next) => {
    AuthController.login(req, res).catch(next);
  }
);

// Google SSO Login
router.post(
  '/google',
  loginLimiter,
  runValidations([
    body('idToken').notEmpty().withMessage('Google ID token is required'),
  ]),
  validate,
  (req, res, next) => {
    AuthController.googleLogin(req, res).catch(next);
  }
);

// Get current user
router.get(
  '/me',
  authenticate,
  (req, res, next) => {
    AuthController.getCurrentUser(req, res).catch(next);
  }
);

// Set password via setup token (external user onboarding)
router.post(
  '/set-password',
  runValidations([
    body('token').notEmpty().withMessage('Setup token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  ]),
  validate,
  (req, res, next) => {
    AuthController.setPassword(req, res).catch(next);
  }
);

// Logout
router.post(
  '/logout',
  authenticate,
  (req, res, next) => {
    AuthController.logout(req, res).catch(next);
  }
);

export default router;
