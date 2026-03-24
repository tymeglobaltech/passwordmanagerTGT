import { Router } from 'express';
import { body, param } from 'express-validator';
import { PasswordController } from '../controllers/password.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { retrievalLimiter } from '../middleware/rateLimiter.middleware';
import { runValidations, validate } from '../middleware/validation.middleware';

const router = Router();

// Generate password (no auth required)
router.post(
  '/generate',
  runValidations([
    body('length').optional().isInt({ min: 8, max: 128 }).withMessage('Length must be between 8 and 128'),
    body('uppercase').optional().isBoolean(),
    body('lowercase').optional().isBoolean(),
    body('numbers').optional().isBoolean(),
    body('symbols').optional().isBoolean(),
  ]),
  validate,
  (req, res, next) => {
    PasswordController.generatePassword(req, res);
  }
);

// Save password
router.post(
  '/',
  authenticate,
  runValidations([
    body('password').notEmpty().withMessage('Password is required'),
    body('title').optional().trim(),
    body('expires_at').optional().isISO8601().withMessage('Invalid expiration date'),
    body('max_access_count').optional().isInt({ min: 1 }).withMessage('Max access count must be at least 1'),
  ]),
  validate,
  (req, res, next) => {
    PasswordController.savePassword(req, res).catch(next);
  }
);

// Retrieve password by GUID (any authenticated user)
router.get(
  '/:guid',
  retrievalLimiter,
  authenticate,
  runValidations([
    param('guid').isUUID().withMessage('Invalid GUID format'),
  ]),
  validate,
  (req, res, next) => {
    PasswordController.retrievePassword(req, res).catch(next);
  }
);

// List user's passwords
router.get(
  '/',
  authenticate,
  (req, res, next) => {
    PasswordController.listPasswords(req, res).catch(next);
  }
);

// Delete password
router.delete(
  '/:guid',
  authenticate,
  runValidations([
    param('guid').isUUID().withMessage('Invalid GUID format'),
  ]),
  validate,
  (req, res, next) => {
    PasswordController.deletePassword(req, res).catch(next);
  }
);

export default router;
