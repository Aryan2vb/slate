/**
 * Auth Service
 * Complete OAuth 2.0 PKCE configuration and Token Lifecycle Manager.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import {
  makeRedirectUri,
  ResponseType,
  TokenResponse,
  refreshAsync,
} from 'expo-auth-session';

// Complete auth session when returning from browser redirect
WebBrowser.maybeCompleteAuthSession();

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  givenName?: string;
  familyName?: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  issuedAt?: number;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'copilot_access_token',
  ID_TOKEN: 'copilot_id_token',
  REFRESH_TOKEN: 'copilot_refresh_token',
  EXPIRES_AT: 'copilot_token_expires_at',
  USER_PROFILE: 'copilot_user_profile',
} as const;

// Safe cross-platform persistent storage
const storage = {
  async getItem(key: string): Promise<string | null> {
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

  async setItem(key: string, value: string): Promise<void> {
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

  async removeItem(key: string): Promise<void> {
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

// OAuth Configuration Constants
export const GOOGLE_OAUTH_CONFIG = {
  discovery: {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    userInfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
  },
  scopes: [
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/calendar.events.readonly',
    'https://www.googleapis.com/auth/calendar.events',
  ],
  clientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    '991610011878-iuupkbjigp34q0g8sv3hh9oaibqhap0f.apps.googleusercontent.com',
};

export function getRedirectUri(): string {
  return makeRedirectUri({
    preferLocalhost: true,
  });
}

/**
 * Token Lifecycle Handler
 */
export async function storeAuthTokens(
  tokens: AuthTokens,
  user?: UserProfile
): Promise<void> {
  if (tokens.accessToken) {
    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
  }
  if (tokens.idToken) {
    await storage.setItem(STORAGE_KEYS.ID_TOKEN, tokens.idToken);
  }
  if (tokens.refreshToken) {
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  }
  if (tokens.expiresIn) {
    const expiresAt = Date.now() + tokens.expiresIn * 1000;
    await storage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());
  }
  if (user) {
    await storage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(user));
  }
}

export async function getStoredTokens(): Promise<AuthTokens | null> {
  const accessToken = await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  if (!accessToken) return null;

  const idToken = (await storage.getItem(STORAGE_KEYS.ID_TOKEN)) || undefined;
  const refreshToken = (await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN)) || undefined;
  const expiresAtStr = await storage.getItem(STORAGE_KEYS.EXPIRES_AT);
  const issuedAt = expiresAtStr ? parseInt(expiresAtStr, 10) : undefined;

  return {
    accessToken,
    idToken,
    refreshToken,
    issuedAt,
  };
}

export async function getStoredUserProfile(): Promise<UserProfile | null> {
  const data = await storage.getItem(STORAGE_KEYS.USER_PROFILE);
  if (!data) return null;
  try {
    return JSON.parse(data) as UserProfile;
  } catch {
    return null;
  }
}

export async function clearAuthSession(): Promise<void> {
  await Promise.all([
    storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
    storage.removeItem(STORAGE_KEYS.ID_TOKEN),
    storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    storage.removeItem(STORAGE_KEYS.EXPIRES_AT),
    storage.removeItem(STORAGE_KEYS.USER_PROFILE),
  ]);
}

/**
 * Fetch user profile from Google UserInfo endpoint using access token
 */
export async function fetchGoogleUserProfile(accessToken: string): Promise<UserProfile> {
  const res = await fetch(GOOGLE_OAUTH_CONFIG.discovery.userInfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Google profile: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return {
    id: json.sub,
    email: json.email,
    name: json.name || json.email.split('@')[0],
    picture: json.picture,
    givenName: json.given_name,
    familyName: json.family_name,
  };
}

/**
 * Attempts silent refresh if a refresh token is present
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) return null;

  try {
    const tokenResult = await refreshAsync(
      {
        clientId: GOOGLE_OAUTH_CONFIG.clientId,
        refreshToken,
        scopes: GOOGLE_OAUTH_CONFIG.scopes,
      },
      GOOGLE_OAUTH_CONFIG.discovery
    );

    if (tokenResult.accessToken) {
      await storeAuthTokens({
        accessToken: tokenResult.accessToken,
        idToken: tokenResult.idToken,
        refreshToken: tokenResult.refreshToken || refreshToken,
        expiresIn: tokenResult.expiresIn,
      });
      return tokenResult.accessToken;
    }
  } catch (err) {
    console.warn('[AuthService] Token refresh failed:', err);
  }

  return null;
}
