import { Router } from 'express';
import {
  googleAuth,
  exchangeGoogleCode,
  refreshGoogleToken,
  startGoogleBrowserAuth,
  handleGoogleBrowserCallback,
} from '../controllers/authController';
import { getEvents } from '../controllers/calendarController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/api/auth/google', googleAuth);
router.post('/api/auth/google/code', exchangeGoogleCode);
router.post('/api/auth/google/refresh', refreshGoogleToken);
router.get('/api/auth/google/start', startGoogleBrowserAuth);
router.get('/api/auth/google/callback', handleGoogleBrowserCallback);
router.get('/api/calendar/events', authMiddleware, getEvents);

export default router;
