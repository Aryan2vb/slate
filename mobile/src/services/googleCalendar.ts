/**
 * Google Calendar API Service
 * Production client to fetch, sanitize, sort upcoming meetings,
 * and provide realistic offline executive fallback agenda.
 */

import {
  CalendarFetchOptions,
  GoogleCalendarAttendee,
  GoogleCalendarEvent,
  GoogleCalendarEventsListResponse,
  MeetingAttendee,
  MeetingEvent,
  MeetingPlatform,
  MeetingResponseStatus,
} from '../types/calendar';

const GOOGLE_CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Normalizes raw Google Calendar attendees into clean domain models
 */
function normalizeAttendees(
  rawAttendees: GoogleCalendarAttendee[] = [],
  organizerEmail?: string
): MeetingAttendee[] {
  return rawAttendees.map((a, index) => {
    const isOrganizer = a.organizer || a.email === organizerEmail;
    const name = a.displayName || a.email.split('@')[0].replace('.', ' ');
    const status: MeetingResponseStatus =
      a.responseStatus === 'accepted' ||
      a.responseStatus === 'declined' ||
      a.responseStatus === 'tentative' ||
      a.responseStatus === 'needsAction'
        ? a.responseStatus
        : 'needsAction';

    return {
      id: `att-${index}-${a.email}`,
      email: a.email,
      name: capitalize(name),
      responseStatus: status,
      isSelf: !!a.self,
      isOrganizer,
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + (index % 5) * 100000000}?w=120&auto=format&fit=crop&q=80`,
    };
  });
}

function capitalize(str: string): string {
  return str
    .split(' ')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

/**
 * Detect meeting platform and conference link
 */
function extractConferenceInfo(event: GoogleCalendarEvent): {
  meetUrl?: string;
  platform: MeetingPlatform;
} {
  // Check conferenceData entryPoints
  if (event.conferenceData?.entryPoints) {
    for (const ep of event.conferenceData.entryPoints) {
      if (ep.entryPointType === 'video' && ep.uri) {
        if (ep.uri.includes('meet.google.com')) {
          return { meetUrl: ep.uri, platform: 'google_meet' };
        }
        if (ep.uri.includes('zoom.us')) {
          return { meetUrl: ep.uri, platform: 'zoom' };
        }
        if (ep.uri.includes('teams.microsoft.com')) {
          return { meetUrl: ep.uri, platform: 'teams' };
        }
        return { meetUrl: ep.uri, platform: 'other' };
      }
    }
  }

  // Check hangoutLink
  if (event.hangoutLink) {
    return { meetUrl: event.hangoutLink, platform: 'google_meet' };
  }

  // Check description and location for Zoom or Meet URLs
  const textToCheck = `${event.location || ''} ${event.description || ''}`;
  const zoomMatch = textToCheck.match(/https:\/\/[a-zA-Z0-9.-]*zoom\.us\/[j|s]\/[a-zA-Z0-9?=_&]+/);
  if (zoomMatch) {
    return { meetUrl: zoomMatch[0], platform: 'zoom' };
  }

  const meetMatch = textToCheck.match(/https:\/\/meet\.google\.com\/[a-z0-9-]+/);
  if (meetMatch) {
    return { meetUrl: meetMatch[0], platform: 'google_meet' };
  }

  const teamsMatch = textToCheck.match(/https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s]+/);
  if (teamsMatch) {
    return { meetUrl: teamsMatch[0], platform: 'teams' };
  }

  if (event.location && !event.location.startsWith('http')) {
    return { platform: 'in_person' };
  }

  return { platform: 'other' };
}

/**
 * Transform raw Google Calendar event into internal typed MeetingEvent
 */
export function transformGoogleCalendarEvent(raw: GoogleCalendarEvent): MeetingEvent {
  const startIso = raw.start?.dateTime || raw.start?.date || new Date().toISOString();
  const endIso = raw.end?.dateTime || raw.end?.date || new Date(Date.now() + 3600000).toISOString();

  const startDate = new Date(startIso);
  const endDate = new Date(endIso);
  const durationMinutes = Math.max(
    15,
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
  );

  const now = Date.now();
  const isLiveNow = now >= startDate.getTime() && now <= endDate.getTime();
  const isAllDay = !raw.start?.dateTime && !!raw.start?.date;

  const { meetUrl, platform } = extractConferenceInfo(raw);

  const organizerEmail = raw.organizer?.email || '';
  const organizerName = raw.organizer?.displayName || organizerEmail.split('@')[0] || 'Organizer';

  return {
    id: raw.id,
    title: raw.summary?.trim() || 'Untitled Meeting',
    description: raw.description?.trim() || '',
    startTime: startIso,
    endTime: endIso,
    startDate,
    endDate,
    durationMinutes,
    location: raw.location,
    meetUrl,
    platform,
    organizer: {
      email: organizerEmail,
      name: organizerName,
    },
    attendees: normalizeAttendees(raw.attendees, organizerEmail),
    isAllDay,
    isConfirmed: raw.status !== 'cancelled',
    isLiveNow,
    dossierStatus: 'ready',
  };
}

/**
 * Fetch calendar events from Google Calendar REST API v3
 */
export async function fetchGoogleCalendarEvents(
  accessToken: string,
  options: CalendarFetchOptions = {}
): Promise<MeetingEvent[]> {
  const timeMin = options.timeMin || new Date(new Date().setHours(0, 0, 0, 0));
  const timeMax = options.timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead

  const params = new URLSearchParams({
    calendarId: 'primary',
    singleEvents: 'true',
    orderBy: options.orderBy || 'startTime',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: (options.maxResults || 25).toString(),
    // Cache buster to prevent HTTP client / OkHttp from serving stale disk cache
    _t: Date.now().toString(),
  });

  const url = `${GOOGLE_CALENDAR_BASE}/calendars/primary/events?${params.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('401: Unauthorized. Google access token has expired.');
    }
    if (res.status === 403) {
      throw new Error('403: Google Calendar API rate limit or quota exceeded.');
    }
    throw new Error(`Google Calendar API Error: ${res.status} ${res.statusText}`);
  }

  const data: GoogleCalendarEventsListResponse = await res.json();
  const rawItems = data.items || [];

  const events = rawItems
    .filter((item) => item.status !== 'cancelled')
    .map(transformGoogleCalendarEvent)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  // Mark the very first upcoming event as next up
  const now = Date.now();
  let foundNext = false;
  for (const ev of events) {
    if (!foundNext && (ev.isLiveNow || ev.startDate.getTime() > now)) {
      ev.isNextUp = true;
      foundNext = true;
    }
  }

  return events;
}
