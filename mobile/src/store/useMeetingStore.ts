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
  tokenRefreshHandler: (() => Promise<string | null>) | null;
  setTokenRefreshHandler: (handler: () => Promise<string | null>) => void;
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
  tokenRefreshHandler: null,

  setTokenRefreshHandler: (handler) => set({ tokenRefreshHandler: handler }),

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
        isLoading: false,
        isRefreshing: false,
        isTokenExpired: false,
      });
      return;
    }

    const refreshFn = onTokenExpired || get().tokenRefreshHandler;

    try {
      console.log('[MeetingStore] Fetching Google Calendar events (refresh:', isPullRefresh, ')...');
      const events = await fetchGoogleCalendarEvents(tokens.accessToken, { maxResults: 100 });
      console.log('[MeetingStore] Successfully fetched events count:', events?.length || 0);
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
      console.warn('[MeetingStore] Fetch error:', errorMessage);
      const is401 = errorMessage.includes('401') || errorMessage.includes('expired');

      // Silent automatic background renewal
      if (is401 && refreshFn) {
        try {
          const freshAccessToken = await refreshFn();
          if (freshAccessToken) {
            set({ tokens: { ...tokens, accessToken: freshAccessToken } });
            const retryEvents = await fetchGoogleCalendarEvents(freshAccessToken, { maxResults: 100 });
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
          console.warn('[MeetingStore] Silent token renewal failed:', refreshErr);
        }
      }

      // Preserve existing events on any network or transient error; never wipe user's desk!
      set({
        events: get().events,
        error: is401 ? null : errorMessage,
        isTokenExpired: false,
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
