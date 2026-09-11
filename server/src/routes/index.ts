import { Router } from 'express';
import {
  googleAuth,
  exchangeGoogleCode,
  refreshGoogleToken,
  startGoogleBrowserAuth,
  handleGoogleBrowserCallback,
} from '../controllers/authController';
import { getEvents } from '../controllers/calendarController';
import {
  getNotes,
  getNote,
  saveNote,
  deleteNote,
} from '../controllers/noteController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

// Auth routes
router.post('/api/auth/google', googleAuth);
router.post('/api/auth/google/code', exchangeGoogleCode);
router.post('/api/auth/google/refresh', refreshGoogleToken);
router.get('/api/auth/google/start', startGoogleBrowserAuth);
router.get('/api/auth/google/callback', handleGoogleBrowserCallback);

// Calendar routes
router.get('/api/calendar/events', authMiddleware, getEvents);

// Notes persistence routes
router.get('/api/notes', optionalAuthMiddleware, getNotes);
router.get('/api/notes/:id', optionalAuthMiddleware, getNote);
router.post('/api/notes', optionalAuthMiddleware, saveNote);
router.delete('/api/notes/:id', optionalAuthMiddleware, deleteNote);

export default router;

