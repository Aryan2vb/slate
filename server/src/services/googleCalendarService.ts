import { google } from 'googleapis';

// ------------------------------------------------------------------
// Google Calendar Service
// ------------------------------------------------------------------
// This service uses access tokens obtained from the client-side PKCE
// exchange (via expo-auth-session). The client sends the Google access
// token to the backend, and we use it to make Google Calendar API calls.
//
// No refresh tokens are stored server-side. When the access token
// expires (~1 hour), the client must re-authenticate.
// ------------------------------------------------------------------

const getOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
};

/**
 * Fetch user profile using a Google access token.
 */
export const getUserProfile = async (accessToken: string) => {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  const oauth2 = google.oauth2({
    auth: oauth2Client,
    version: 'v2'
  });

  const res = await oauth2.userinfo.get();
  return res.data;
};

/**
 * Fetch upcoming calendar events for the next 7 days.
 * 
 * @param accessToken Google access token from client-side PKCE exchange
 * @param maxResults Maximum number of events to return (default: 20)
 */
export const getUpcomingEvents = async (accessToken: string, maxResults = 20) => {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  
  // Create an authenticated Calendar client
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  // Fetch events for the next 7 days
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: weekFromNow.toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = res.data.items || [];
  
  return events.map(event => ({
    id: event.id,
    title: event.summary || 'Untitled Event',
    description: event.description,
    startTime: event.start?.dateTime || event.start?.date,
    endTime: event.end?.dateTime || event.end?.date,
    attendeeCount: event.attendees?.length || 0,
    attendees: event.attendees?.map(a => ({
      email: a.email || '',
      displayName: a.displayName,
      responseStatus: a.responseStatus,
    })),
    location: event.location,
    htmlLink: event.htmlLink,
    meetLink: event.hangoutLink,
  }));
};
