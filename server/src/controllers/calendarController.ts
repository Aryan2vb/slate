import { Request, Response } from 'express';
import { getUpcomingEvents } from '../services/googleCalendarService';

/**
 * Get calendar events using the Google access token from the client.
 * 
 * The client passes the Google access token via the `X-Google-Access-Token`
 * header. The JWT auth middleware has already verified the app session.
 */
export const getEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get Google access token from the request header
    const googleAccessToken = req.headers['x-google-access-token'] as string | undefined;
    
    if (!googleAccessToken) {
      res.status(403).json({ error: 'No Google access token provided. Please sign in with Google.' });
      return;
    }

    try {
      const events = await getUpcomingEvents(googleAccessToken);
      res.status(200).json({ events });
    } catch (calendarErr: any) {
      // Handle specific Google API errors
      const status = calendarErr?.response?.status || calendarErr?.code;
      
      if (status === 401 || status === 'UNAUTHENTICATED') {
        res.status(401).json({ error: 'Google access token expired. Please sign in again.' });
        return;
      }
      
      if (status === 403) {
        res.status(403).json({ error: 'Calendar access denied or API quota exceeded.' });
        return;
      }

      throw calendarErr;
    }
  } catch (error) {
    console.error('Fetch Events Error:', error);
    res.status(500).json({ error: 'Internal server error while fetching calendar events' });
  }
};
