import { Request, Response } from 'express';
import {
  getUserNotes,
  getUserNoteById,
  saveUserNote,
  deleteUserNote,
} from '../store/noteStore';

/**
 * Get all notes for the authenticated user.
 */
export const getNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || 'anonymous-user';
    const notes = getUserNotes(userId);
    res.status(200).json({ notes });
  } catch (error) {
    console.error('Failed to get notes:', error);
    res.status(500).json({ error: 'Failed to retrieve notes' });
  }
};

/**
 * Get a single note by ID.
 */
export const getNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || 'anonymous-user';
    const { id } = req.params;
    const note = getUserNoteById(userId, id);
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }
    res.status(200).json({ note });
  } catch (error) {
    console.error('Failed to get note by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve note' });
  }
};

/**
 * Save or update a note.
 */
export const saveNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || 'anonymous-user';
    const noteInput = req.body;

    if (!noteInput || typeof noteInput !== 'object') {
      res.status(400).json({ error: 'Invalid note payload' });
      return;
    }

    const saved = saveUserNote(userId, noteInput);
    res.status(200).json({ note: saved, success: true });
  } catch (error) {
    console.error('Failed to save note:', error);
    res.status(500).json({ error: 'Failed to save note' });
  }
};

/**
 * Delete a note by ID.
 */
export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId || 'anonymous-user';
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Missing note ID' });
      return;
    }

    const deleted = deleteUserNote(userId, id);
    if (!deleted) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.status(200).json({ success: true, id });
  } catch (error) {
    console.error('Failed to delete note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
};
