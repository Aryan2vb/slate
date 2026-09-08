import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { User, authenticateWithGoogle, refreshGoogleAccessToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  /** Google access token for making direct Google API calls (calendar, etc.) */
  googleAccessToken: string | null;
  /** Long-lived Google refresh token for silent background renewal */
  googleRefreshToken: string | null;
  isLoading: boolean;
  /**
   * Sign in using tokens obtained from Google OAuth.
   * @param googleAccessToken The Google access_token
   * @param idToken Optional Google id_token for backend identity verification
   * @param refreshToken Optional Google refresh_token for automatic background renewal
   */
  signIn: (googleAccessToken: string, idToken?: string, refreshToken?: string | null) => Promise<void>;
  /** Direct session hydration from server auth response */
  setSession: (token: string, user: User, accessToken: string, refreshToken?: string | null) => Promise<void>;
  /**
   * Silently refresh Google access token using the stored refresh token.
   * Returns the new access token, or null if refresh failed.
   */
  refreshAccessToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const GOOGLE_ACCESS_TOKEN_KEY = 'google_access_token';
const GOOGLE_REFRESH_TOKEN_KEY = 'google_refresh_token';

// Safe cross-platform storage (SecureStore on Native, localStorage on Web)
const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      } catch {}
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },
  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      } catch {}
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleRefreshToken, setGoogleRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore existing session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedToken = await storage.getItem(TOKEN_KEY);
        const storedUser = await storage.getItem(USER_KEY);
        const storedGoogleAccessToken = await storage.getItem(GOOGLE_ACCESS_TOKEN_KEY);
        const storedGoogleRefreshToken = await storage.getItem(GOOGLE_REFRESH_TOKEN_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setGoogleAccessToken(storedGoogleAccessToken);
          setGoogleRefreshToken(storedGoogleRefreshToken);
        }
      } catch (error) {
        console.error('Failed to load session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  /**
   * Complete Google sign in:
   * 1. Send tokens to backend for user profile & app session JWT
   * 2. Store user profile, Google access token, and refresh token
   */
  const signIn = async (accessToken: string, idToken?: string, refreshToken?: string | null) => {
    setIsLoading(true);
    try {
      const data = await authenticateWithGoogle(accessToken, idToken);
      setToken(data.token);
      setUser(data.user);
      setGoogleAccessToken(accessToken);

      await storage.setItem(TOKEN_KEY, data.token);
      await storage.setItem(USER_KEY, JSON.stringify(data.user));
      await storage.setItem(GOOGLE_ACCESS_TOKEN_KEY, accessToken);

      if (refreshToken) {
        setGoogleRefreshToken(refreshToken);
        await storage.setItem(GOOGLE_REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Direct session hydration from server auth response
   */
  const setSession = async (
    jwtToken: string,
    authenticatedUser: User,
    accessToken: string,
    refreshToken?: string | null,
  ) => {
    setIsLoading(true);
    try {
      setToken(jwtToken);
      setUser(authenticatedUser);
      setGoogleAccessToken(accessToken);

      await storage.setItem(TOKEN_KEY, jwtToken);
      await storage.setItem(USER_KEY, JSON.stringify(authenticatedUser));
      await storage.setItem(GOOGLE_ACCESS_TOKEN_KEY, accessToken);

      if (refreshToken) {
        setGoogleRefreshToken(refreshToken);
        await storage.setItem(GOOGLE_REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (error) {
      console.error('setSession failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Silently fetch a new access token without requiring user interaction.
   */
  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const currentRefreshToken = googleRefreshToken || (await storage.getItem(GOOGLE_REFRESH_TOKEN_KEY));
      if (!currentRefreshToken) {
        console.warn('[AuthContext] Cannot refresh token: No refresh token stored.');
        return null;
      }

      const res = await refreshGoogleAccessToken(currentRefreshToken);
      if (res.accessToken) {
        setGoogleAccessToken(res.accessToken);
        await storage.setItem(GOOGLE_ACCESS_TOKEN_KEY, res.accessToken);
        return res.accessToken;
      }
      return null;
    } catch (error) {
      console.error('[AuthContext] Token refresh failed:', error);
      return null;
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      setToken(null);
      setUser(null);
      setGoogleAccessToken(null);
      setGoogleRefreshToken(null);

      await storage.deleteItem(TOKEN_KEY);
      await storage.deleteItem(USER_KEY);
      await storage.deleteItem(GOOGLE_ACCESS_TOKEN_KEY);
      await storage.deleteItem(GOOGLE_REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        googleAccessToken,
        googleRefreshToken,
        isLoading,
        signIn,
        setSession,
        refreshAccessToken,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
