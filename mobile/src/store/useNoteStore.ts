import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, CreateNoteInput } from '../types/notes';

interface NoteState {
  notes: Note[];
  activeNoteId: string | null;

  // Actions
  saveNote: (input: CreateNoteInput) => Note;
  deleteNote: (id: string) => void;
  getNoteById: (id: string) => Note | undefined;
  setActiveNoteId: (id: string | null) => void;
  assignNoteToFolder: (noteId: string, folderId?: string, folderName?: string) => void;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: [],
      activeNoteId: null,

      saveNote: (input: CreateNoteInput) => {
        const now = new Date().toISOString();
        const existingId = input.id;
        const currentNotes = get().notes;

        const rawTitle = input.title?.trim() || '';
        const isDraft = !rawTitle || rawTitle.toLowerCase() === 'untitled note' || rawTitle.toLowerCase() === 'draft';
        const finalTitle = isDraft ? 'Untitled note' : rawTitle;

        const bodyText = input.body || '';
        const detected = Array.from(new Set(bodyText.match(URL_REGEX) || []));

        if (existingId) {
          const index = currentNotes.findIndex((n) => n.id === existingId);
          if (index !== -1) {
            const existing = currentNotes[index];
            const updatedNote: Note = {
              ...existing,
              ...input,
              id: existingId,
              title: finalTitle,
              body: bodyText,
              isDraft,
              folderId: input.folderId !== undefined ? input.folderId : existing.folderId,
              folderName: input.folderName !== undefined ? input.folderName : existing.folderName,
              detectedLinks: detected,
              updatedAt: now,
            };

            const updatedNotes = [...currentNotes];
            updatedNotes[index] = updatedNote;

            // Sort so most recently updated note is on top
            updatedNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

            set({ notes: updatedNotes, activeNoteId: updatedNote.id });
            return updatedNote;
          }
        }

        // New note creation
        const newNote: Note = {
          id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: finalTitle,
          body: bodyText,
          isDraft,
          folderId: input.folderId,
          folderName: input.folderName,
          detectedLinks: detected,
          createdAt: now,
          updatedAt: now,
          meetingId: input.meetingId,
          meetingTitle: input.meetingTitle,
          elapsedSeconds: input.elapsedSeconds || 0,
          tags: input.tags || [],
          summaryBulletPoints: input.summaryBulletPoints || [],
        };

        const newNotes = [newNote, ...currentNotes];
        set({ notes: newNotes, activeNoteId: newNote.id });
        return newNote;
      },

      deleteNote: (id: string) => {
        const filtered = get().notes.filter((n) => n.id !== id);
        set({
          notes: filtered,
          activeNoteId: get().activeNoteId === id ? null : get().activeNoteId,
        });
      },

      assignNoteToFolder: (noteId: string, folderId?: string, folderName?: string) => {
        const now = new Date().toISOString();
        const currentNotes = get().notes;
        const updated = currentNotes.map((n) =>
          n.id === noteId
            ? { ...n, folderId, folderName, updatedAt: now }
            : n
        );
        set({ notes: updated });
      },

      getNoteById: (id: string) => {
        return get().notes.find((n) => n.id === id);
      },

      setActiveNoteId: (id: string | null) => {
        set({ activeNoteId: id });
      },
    }),
    {
      name: 'slate-notes-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
