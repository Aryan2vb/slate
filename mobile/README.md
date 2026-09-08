# Nabla — AI Executive Meeting Copilot

Expo (iOS / Android) client for the meeting copilot. Dark-mode executive
precision: high-contrast type, zero visual noise, tactile micro-interactions.

## Run

```bash
cp .env.example .env      # fill in EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
npm install
npx expo start
```

The backend in `../server` provides Google OAuth exchange and calendar reads.
Without it the app still runs — Screen 1 falls back to a labelled sample agenda
so the whole flow stays demonstrable.

## Architecture

Three screens on a linear flow, driven by a small route state machine in
`App.tsx` rather than a navigation library.

| Screen | File | Role |
| --- | --- | --- |
| Command Center | `src/screens/CommandCenterScreen.tsx` | Today's agenda: hero "next up" card + timeline feed |
| AI Dossier | `src/screens/DossierScreen.tsx` | Bento intel sheet: context, roster, objective checklist |
| Live Copilot | `src/screens/LiveCopilotScreen.tsx` | Recording studio: waveform, streaming notes, action dock |

Objectives flagged on the dossier travel into the live session and pin above
the note feed.

## Design system

Everything visual resolves through `src/theme/tokens.ts` — colours, the 4pt
spacing scale, radii, the type ramp, and a single shared spring config
(`damping: 15, stiffness: 150`). No component defines its own hex value.

`src/theme/haptics.ts` maps four *intents* to sensations, so call sites say
what happened rather than how hard to buzz:

| Intent | Feedback | Used for |
| --- | --- | --- |
| `primary` | Impact Medium | Primary CTAs |
| `select` | Impact Light | Chips, pills, navigation |
| `flag` | Notification Success | Action items, bookmarks |
| `stop` | Impact Heavy | Ending a recording |

Shared primitives live in `src/components/`. `PressableScale` is the only
interactive element — it owns the 0.96 press compression and fires the matching
haptic on press-*in*, so the buzz lands with the finger.

## Simulated data

The live transcript is scripted, not transcribed. `SCRIPTED_STREAM` in
`src/data/intel.ts` plays back one note every 3s; swapping that array for a
socket feed is the only change needed to go live, since every view reacts to
the `notes` array.

Researched dossier content exists for the sample Sequoia meeting. Real calendar
events get a generic dossier that states what the copilot *doesn't* know rather
than inventing a history the user would catch.
