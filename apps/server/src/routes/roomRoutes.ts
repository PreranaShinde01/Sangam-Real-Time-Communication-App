import { Router } from 'express';
import { roomController } from '../controllers/roomController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { roomJoinLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/', authenticate, roomController.createRoom);
router.get('/my-meetings', authenticate, roomController.getUserMeetings);
router.get('/:codeOrId', optionalAuth, roomJoinLimiter, roomController.getRoom);
router.post('/:roomId/verify-passcode', optionalAuth, roomController.verifyPasscode);
router.get('/:roomId/calendar.ics', roomController.downloadIcs);

export const roomRoutes = router;
