import { Router } from 'express';
import { body, param, query as queryValidator } from 'express-validator';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { runValidations, validate } from '../middleware/validation.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Get all users
router.get('/users', (req, res, next) => {
  AdminController.getUsers(req, res).catch(next);
});

// Create user
router.post(
  '/users',
  runValidations([
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('full_name').optional().trim(),
    body('email').isEmail().withMessage('Invalid email address'),
    body('password')
      .optional({ values: 'falsy' })
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    body('role').isIn(['admin', 'user', 'external']).withMessage('Role must be admin, user, or external'),
    body('auth_provider').optional().isIn(['local', 'google', 'both']).withMessage('Invalid auth provider'),
  ]),
  validate,
  (req, res, next) => {
    AdminController.createUser(req, res).catch(next);
  }
);

// Bulk create users
router.post(
  '/users/bulk',
  runValidations([
    body('entries').isArray({ min: 1, max: 500 }).withMessage('entries must be an array of 1 to 500 items'),
  ]),
  validate,
  (req, res, next) => {
    AdminController.bulkCreateUsers(req, res).catch(next);
  }
);

// Update user
router.put(
  '/users/:id',
  runValidations([
    param('id').isUUID().withMessage('Invalid user ID'),
    body('username').optional().trim().notEmpty(),
    body('full_name').optional().trim(),
    body('email').optional().isEmail(),
    body('password')
      .optional()
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['admin', 'user', 'external']),
    body('is_active').optional().isBoolean(),
  ]),
  validate,
  (req, res, next) => {
    AdminController.updateUser(req, res).catch(next);
  }
);

// Preview a password transfer, flagging likely duplicates
router.get(
  '/users/:id/transfer-preview',
  runValidations([
    param('id').isUUID().withMessage('Invalid user ID'),
    queryValidator('targetUserId').isUUID().withMessage('Invalid target user ID'),
  ]),
  validate,
  (req, res, next) => {
    AdminController.getTransferPreview(req, res).catch(next);
  }
);

// Transfer all passwords owned by one user to another
router.put(
  '/users/:id/transfer-passwords',
  runValidations([
    param('id').isUUID().withMessage('Invalid user ID'),
    body('targetUserId').isUUID().withMessage('Invalid target user ID'),
    body('passwordIds').optional().isArray().withMessage('passwordIds must be an array'),
    body('passwordIds.*').isUUID().withMessage('Invalid password ID'),
  ]),
  validate,
  (req, res, next) => {
    AdminController.transferPasswords(req, res).catch(next);
  }
);

// Delete user
router.delete(
  '/users/:id',
  runValidations([
    param('id').isUUID().withMessage('Invalid user ID'),
  ]),
  validate,
  (req, res, next) => {
    AdminController.deleteUser(req, res).catch(next);
  }
);

// Get access logs
router.get('/logs', (req, res, next) => {
  AdminController.getAccessLogs(req, res).catch(next);
});

// Get statistics
router.get('/stats', (req, res, next) => {
  AdminController.getStatistics(req, res).catch(next);
});

export default router;
