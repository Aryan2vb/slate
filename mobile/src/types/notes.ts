export interface Folder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
}

export interface Note {
  id: string;
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

export type CreateNoteInput = Omit<Note, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};
