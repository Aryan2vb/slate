/**
 * Global Meeting and Calendar Store (Zustand)
 * Exclusively manages user session and real Google Calendar events.
 */

import { create } from 'zustand';
import { MeetingEvent } from '../types/calendar';
import { fetchGoogleCalendarEvents } from '../services/googleCalendar';
import {
  AuthTokens,
  UserProfile,
  clearAuthSession,
  getStoredTokens,
  getStoredUserProfile,
  storeAuthTokens,
} from '../services/auth';

interface MeetingState {
  // Session State
  user: UserProfile | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isInitializing: boolean;

  // Calendar & Events State
  events: MeetingEvent[];
  selectedMeeting: MeetingEvent | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  isTokenExpired: boolean;

  // Actions
  initializeSession: () => Promise<void>;
  setSession: (tokens: AuthTokens, user?: UserProfile) => Promise<void>;
  signOut: () => Promise<void>;
  fetchMeetings: (isPullRefresh?: boolean, onTokenExpired?: () => Promise<string | null>) => Promise<void>;
  selectMeeting: (id: string | null) => void;
}

export const useMeetingStore = create<MeetingState>((set, get) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isInitializing: true,

  events: [],
  selectedMeeting: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  isTokenExpired: false,

  initializeSession: async () => {
    try {
      const tokens = await getStoredTokens();
      const user = await getStoredUserProfile();
      if (tokens?.accessToken) {
        set({
          tokens,
          user: user || null,
          isAuthenticated: true,
          isInitializing: false,
        });
        await get().fetchMeetings();
      } else {
        set({ isInitializing: false });
      }
    } catch {
      set({ isInitializing: false });
    }
  },

  setSession: async (tokens, user) => {
    await storeAuthTokens(tokens);
    set({
      tokens,
      user: user || null,
      isAuthenticated: true,
      isTokenExpired: false,
      error: null,
    });
    await get().fetchMeetings();
  },

  signOut: async () => {
    await clearAuthSession();
    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
      events: [],
      selectedMeeting: null,
      error: null,
      isTokenExpired: false,
    });
  },

  fetchMeetings: async (isPullRefresh = false, onTokenExpired?: () => Promise<string | null>) => {
    const { tokens } = get();

    if (isPullRefresh) {
      set({ isRefreshing: true, error: null });
    } else {
      set({ isLoading: true, error: null });
    }

    if (!tokens?.accessToken) {
      set({
        events: [],
        selectedMeeting: null,
        isLoading: false,
        isRefreshing: false,
        isTokenExpired: false,
      });
      return;
    }

    try {
      const events = await fetchGoogleCalendarEvents(tokens.accessToken);
      set({
        events: events || [],
        selectedMeeting: events[0] || null,
        isLoading: false,
        isRefreshing: false,
        error: null,
        isTokenExpired: false,
      });
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to sync Google Calendar';
      const is401 = errorMessage.includes('401') || errorMessage.includes('expired');
      console.warn('[MeetingStore] Calendar fetch failed:', errorMessage);

      // Silent automatic retry if token refresh handler is provided
      if (is401 && onTokenExpired) {
        try {
          console.log('[MeetingStore] Attempting automatic silent token refresh...');
          const freshAccessToken = await onTokenExpired();
          if (freshAccessToken) {
            console.log('[MeetingStore] Token refreshed, retrying Google Calendar fetch...');
            set({ tokens: { ...tokens, accessToken: freshAccessToken } });
            const retryEvents = await fetchGoogleCalendarEvents(freshAccessToken);
            set({
              events: retryEvents || [],
              selectedMeeting: retryEvents[0] || null,
              isLoading: false,
              isRefreshing: false,
              error: null,
              isTokenExpired: false,
            });
            return;
          }
        } catch (refreshErr) {
          console.error('[MeetingStore] Silent refresh failed:', refreshErr);
        }
      }

      set({
        events: [],
        selectedMeeting: null,
        error: errorMessage,
        isTokenExpired: is401,
        isLoading: false,
        isRefreshing: false,
      });
    }
  },

  selectMeeting: (id) => {
    if (!id) {
      set({ selectedMeeting: null });
      return;
    }
    const meeting = get().events.find((e) => e.id === id) || null;
    set({ selectedMeeting: meeting });
  },
}));
