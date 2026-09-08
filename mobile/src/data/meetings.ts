import { CalendarEvent } from '../services/api';
import { Person } from '../components/Avatar';

export interface Meeting {
  id: string;
  title: string;
  /** Counterparty org, shown as the card's subtitle. */
  org?: string;
  startTime: Date;
  endTime: Date;
  /** Category chips: 'Strategy', '1:1', 'Sales'… */
  tags: string[];
  people: Person[];
  location?: string;
  description?: string;
  /** True when this row is sample content rather than the user's calendar. */
  isSample?: boolean;
}

/* ------------------------------------------------------------------ */
/* Calendar -> Meeting                                                 */
/* ------------------------------------------------------------------ */

/**
 * Infers category chips from the event title and shape.
 *
 * This is deliberately shallow keyword matching — it is presentation metadata,
 * not a classification the user relies on, so a miss costs nothing.
 */
function inferTags(event: CalendarEvent): string[] {
  const haystack = `${event.title} ${event.description ?? ''}`.toLowerCase();
  const tags: string[] = [];

  const rules: [RegExp, string][] = [
    [/\b(pitch|investor|vc|series [a-e]|fundrais)/, 'Fundraising'],
    [/\b(sales|demo|prospect|pipeline|deal)/, 'Sales'],
    [/\b(strategy|roadmap|planning|offsite|board)/, 'Strategy'],
    [/\b(interview|candidate|hiring|screen)/, 'Hiring'],
    [/\b(standup|stand-up|sync|weekly)/, 'Sync'],
    [/\b(review|retro|postmortem|post-mortem)/, 'Review'],
  ];

  for (const [pattern, tag] of rules) {
    if (pattern.test(haystack)) tags.push(tag);
  }

  // Exactly two people on the invite is the reliable 1:1 signal.
  if (event.attendeeCount === 2) tags.push('1:1');

  return tags.length > 0 ? tags.slice(0, 3) : ['Meeting'];
}

/**
 * The Calendar API gives us a headcount but not a roster, so we synthesise
 * placeholder seats to keep the avatar row honest about scale. Real names
 * arrive once the backend starts returning attendee details.
 */
function placeholderRoster(event: CalendarEvent): Person[] {
  return Array.from({ length: Math.min(event.attendeeCount, 5) }, (_, index) => ({
    id: `${event.id}-seat-${index}`,
    name: `Attendee ${index + 1}`,
  }));
}

export function toMeeting(event: CalendarEvent): Meeting {
  return {
    id: event.id,
    title: event.title,
    startTime: new Date(event.startTime),
    endTime: new Date(event.endTime),
    tags: inferTags(event),
    people: placeholderRoster(event),
    location: event.location || event.meetLink,
    description: event.description,
  };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

export function formatClock(date: Date): string {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatRange(meeting: Meeting): string {
  return `${formatClock(meeting.startTime)} – ${formatClock(meeting.endTime)}`;
}

/**
 * Human countdown for the hero card: "In 14m", "In 2h 05m", "Now", "Ended".
 */
export function formatCountdown(start: Date, end: Date, now: Date = new Date()): string {
  if (now >= end) return 'Ended';
  if (now >= start) return 'Now';

  const totalMinutes = Math.round((start.getTime() - now.getTime()) / 60_000);
  if (totalMinutes < 1) return 'Starting';
  if (totalMinutes < 60) return `In ${totalMinutes}m`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours >= 24) return `In ${Math.floor(hours / 24)}d`;
  return `In ${hours}h ${String(minutes).padStart(2, '0')}m`;
}

/** Elapsed seconds -> HH:MM:SS for the live recording timer. */
export function formatElapsed(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
}
