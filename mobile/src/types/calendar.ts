/**
 * Calendar and Meeting Domain Types
 * Strict typing for Google Calendar API v3 and internal Copilot models.
 */

// ---------------------------------------------------------------------------
// Google Calendar API v3 Raw Types
// ---------------------------------------------------------------------------

export interface GoogleCalendarEventDateTime {
  date?: string; // YYYY-MM-DD for all-day events
  dateTime?: string; // ISO 8601
  timeZone?: string;
}

export interface GoogleCalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  self?: boolean;
  organizer?: boolean;
}

export interface GoogleCalendarConferenceData {
  entryPoints?: Array<{
    entryPointType: 'video' | 'phone' | 'sip' | 'more';
    uri: string;
    label?: string;
  }>;
  conferenceSolution?: {
    name: string;
    iconUri?: string;
  };
}

export interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink?: string;
  created?: string;
  updated?: string;
  start?: GoogleCalendarEventDateTime;
  end?: GoogleCalendarEventDateTime;
  attendees?: GoogleCalendarAttendee[];
  organizer?: {
    email: string;
    displayName?: string;
    self?: boolean;
  };
  conferenceData?: GoogleCalendarConferenceData;
  hangoutLink?: string;
  recurringEventId?: string;
}

export interface GoogleCalendarEventsListResponse {
  kind: 'calendar#events';
  etag: string;
  summary: string;
  description?: string;
  updated: string;
  timeZone: string;
  accessRole: string;
  nextPageToken?: string;
  items: GoogleCalendarEvent[];
}

// ---------------------------------------------------------------------------
// Internal Normalized Domain Models
// ---------------------------------------------------------------------------

export type MeetingResponseStatus = 'accepted' | 'declined' | 'tentative' | 'needsAction';

export interface MeetingAttendee {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  responseStatus: MeetingResponseStatus;
  isSelf: boolean;
  isOrganizer: boolean;
}

export type MeetingPlatform = 'google_meet' | 'zoom' | 'teams' | 'in_person' | 'other';

export interface MeetingEvent {
  id: string;
  title: string;
  description: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  startDate: Date;
  endDate: Date;
  durationMinutes: number;
  location?: string;
  meetUrl?: string;
  platform: MeetingPlatform;
  organizer: {
    email: string;
    name: string;
  };
  attendees: MeetingAttendee[];
  isAllDay: boolean;
  isConfirmed: boolean;
  isNextUp?: boolean;
  isLiveNow?: boolean;
  /** Intelligence dossier prep status */
  dossierStatus?: 'ready' | 'generating' | 'not_requested';
}

export interface CalendarFetchOptions {
  timeMin?: Date;
  timeMax?: Date;
  maxResults?: number;
  singleEvents?: boolean;
  orderBy?: 'startTime' | 'updated';
}
