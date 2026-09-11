import fs from 'fs';
import path from 'path';

export interface ServerNote {
  id: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  folderId?: string;
  folderName?: string;
  isDraft?: boolean;
  meetingId?: string;
  meetingTitle?: string;
  elapsedSeconds?: number;
  tags?: string[];
  summaryBulletPoints?: string[];
  detectedLinks?: string[];
  isPinned?: boolean;
}

const DATA_DIR = path.join(__dirname, '../../data');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');

let notesCache: ServerNote[] = [];

function ensureDataFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(NOTES_FILE)) {
      fs.writeFileSync(NOTES_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Failed to initialize notes storage directory/file:', err);
  }
}

function loadNotesFromDisk(): void {
  try {
    ensureDataFile();
    if (fs.existsSync(NOTES_FILE)) {
      const data = fs.readFileSync(NOTES_FILE, 'utf-8');
      notesCache = JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to read notes from disk, falling back to memory:', err);
    notesCache = [];
  }
}

function persistNotesToDisk(): void {
  try {
    ensureDataFile();
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notesCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write notes to disk:', err);
  }
}

// Initialize store from disk
loadNotesFromDisk();

export const getUserNotes = (userId: string): ServerNote[] => {
  return notesCache
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

export const getUserNoteById = (userId: string, noteId: string): ServerNote | undefined => {
  return notesCache.find((n) => n.userId === userId && n.id === noteId);
};

export const saveUserNote = (
  userId: string,
  noteData: Partial<ServerNote> & { id?: string }
): ServerNote => {
  const now = new Date().toISOString();
  const existingIndex = noteData.id
    ? notesCache.findIndex((n) => n.userId === userId && n.id === noteData.id)
    : -1;

  if (existingIndex !== -1) {
    const existing = notesCache[existingIndex];
    const updated: ServerNote = {
      ...existing,
      ...noteData,
      id: existing.id,
      userId,
      title: noteData.title !== undefined ? (noteData.title.trim() || 'Untitled note') : existing.title,
      body: noteData.body !== undefined ? noteData.body : existing.body,
      folderId: noteData.folderId !== undefined ? noteData.folderId : existing.folderId,
      folderName: noteData.folderName !== undefined ? noteData.folderName : existing.folderName,
      isDraft: noteData.isDraft !== undefined ? noteData.isDraft : existing.isDraft,
      detectedLinks: noteData.detectedLinks !== undefined ? noteData.detectedLinks : existing.detectedLinks,
      updatedAt: now,
    };
    notesCache[existingIndex] = updated;
    persistNotesToDisk();
    return updated;
  }

  const newNote: ServerNote = {
    id: noteData.id || `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    title: noteData.title?.trim() || 'Untitled note',
    body: noteData.body || '',
    folderId: noteData.folderId,
    folderName: noteData.folderName,
    isDraft: noteData.isDraft,
    detectedLinks: noteData.detectedLinks || [],
    createdAt: noteData.createdAt || now,
    updatedAt: now,
    meetingId: noteData.meetingId,
    meetingTitle: noteData.meetingTitle,
    elapsedSeconds: noteData.elapsedSeconds || 0,
    tags: noteData.tags || [],
    summaryBulletPoints: noteData.summaryBulletPoints || [],
    isPinned: noteData.isPinned || false,
  };

  notesCache.unshift(newNote);
  persistNotesToDisk();
  return newNote;
};

export const deleteUserNote = (userId: string, noteId: string): boolean => {
  const initialLength = notesCache.length;
  notesCache = notesCache.filter((n) => !(n.userId === userId && n.id === noteId));
  if (notesCache.length !== initialLength) {
    persistNotesToDisk();
    return true;
  }
  return false;
};
