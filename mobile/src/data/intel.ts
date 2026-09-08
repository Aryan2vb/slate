import { Person } from '../components/Avatar';
import { Meeting } from './meetings';

/* ------------------------------------------------------------------ */
/* Pre-meeting dossier & Objective Types                               */
/* ------------------------------------------------------------------ */

export interface Objective {
  id: string;
  question: string;
  rationale: string;
}

export interface Dossier {
  context: string[];
  roster: Person[];
  objectives: Objective[];
  commonTopics: Record<string, string[]>;
}

/**
 * Clean, truthful dossier for a real Google Calendar event.
 * Avoids fabricating history; presents verified meeting parameters and clear discussion goals.
 */
export function dossierFor(meeting: Meeting): Dossier {
  return {
    context: [
      `${meeting.people.length} invitee${meeting.people.length === 1 ? '' : 's'} on calendar invite.`,
      meeting.location ? `Location: ${meeting.location}` : 'No meeting link or location specified.',
    ],
    roster: meeting.people,
    objectives: [
      {
        id: `${meeting.id}-obj-alignment`,
        question: 'What are the main priorities and decisions for this session?',
        rationale: 'Aligns agenda outcomes in the first two minutes.',
      },
      {
        id: `${meeting.id}-obj-blockers`,
        question: 'Are there any immediate blockers or open questions?',
        rationale: 'Surfaces obstacles while team members are present.',
      },
      {
        id: `${meeting.id}-obj-nextsteps`,
        question: 'What are our concrete action items and deadlines?',
        rationale: 'Ensures clear ownership before concluding.',
      },
    ],
    commonTopics: {},
  };
}

/* ------------------------------------------------------------------ */
/* Live Note Stream Types                                              */
/* ------------------------------------------------------------------ */

export type NoteKind = 'action' | 'metric' | 'decision' | 'note';

export interface LiveNote {
  id: string;
  text: string;
  kind: NoteKind;
  speaker?: string;
  at: number;
  manual?: boolean;
}

export const NOTE_LABELS: Record<NoteKind, string> = {
  action: 'Action Item',
  metric: 'Key Metric',
  decision: 'Decision',
  note: 'Note',
};
