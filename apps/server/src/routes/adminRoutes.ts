import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@sangam/shared';

const router = Router();

router.use(authenticate);
router.use(requireRole(UserRole.ADMIN));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);
router.get('/audit-logs', adminController.getAuditLogs);

export const adminRoutes = router;
