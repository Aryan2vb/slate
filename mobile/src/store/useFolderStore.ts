import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Folder } from '../types/notes';

interface FolderState {
  folders: Folder[];
  selectedFolderId: string | null;

  createFolder: (name: string, description?: string) => Folder;
  updateFolder: (id: string, name: string, description?: string) => void;
  deleteFolder: (id: string) => void;
  setSelectedFolderId: (id: string | null) => void;
  getFolderById: (id: string) => Folder | undefined;
}

export const useFolderStore = create<FolderState>()(
  persist(
    (set, get) => ({
      folders: [],
      selectedFolderId: null,

      createFolder: (name: string, description?: string) => {
        const newFolder: Folder = {
          id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: name.trim(),
          description: description?.trim() || '',
          createdAt: new Date().toISOString(),
        };

        set({ folders: [newFolder, ...get().folders] });
        return newFolder;
      },

      updateFolder: (id: string, name: string, description?: string) => {
        set({
          folders: get().folders.map((f) =>
            f.id === id
              ? { ...f, name: name.trim(), description: description?.trim() || '' }
              : f
          ),
        });
      },

      deleteFolder: (id: string) => {
        set({
          folders: get().folders.filter((f) => f.id !== id),
          selectedFolderId:
            get().selectedFolderId === id ? null : get().selectedFolderId,
        });
      },

      setSelectedFolderId: (id: string | null) => {
        set({ selectedFolderId: id });
      },

      getFolderById: (id: string) => {
        return get().folders.find((f) => f.id === id);
      },
    }),
    {
      name: 'slate-folders-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
