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
import { createSession, initUpload, completeSession, getSession, mapSpeaker } from '../controllers/meetingController';

const router = Router();

// Auth routes
router.post('/api/auth/google', googleAuth);
router.post('/api/auth/google/code', exchangeGoogleCode);
router.post('/api/auth/google/refresh', refreshGoogleToken);
router.get('/api/auth/google/start', startGoogleBrowserAuth);
router.get('/api/auth/google/callback', handleGoogleBrowserCallback);

// Calendar routes
router.get('/api/calendar/events', authMiddleware, getEvents);

router.post('/meeting-sessions', authMiddleware, createSession);
router.post('/uploads/init', authMiddleware, initUpload);
router.post('/meeting-sessions/:id/complete', authMiddleware, completeSession);
router.get('/meeting-sessions/:id', authMiddleware, getSession);
router.post('/speaker-mappings', authMiddleware, mapSpeaker);

export default router;
