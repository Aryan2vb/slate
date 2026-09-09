import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const getApiUrl = (): string => {
  // In development, strictly use the local laptop IP and never Render
  if (__DEV__) {
    if (Platform.OS === 'web') {
      return 'http://localhost:3001';
    }

    // Expo Go dynamically provides the host machine's LAN IP
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:3001`;
      }
    }

    // Direct laptop Wi-Fi IP fallback
    return 'http://10.7.26.227:3001';
  }

  // In production / preview APK builds
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  return envUrl || 'https://slate-backend-8c9l.onrender.com';
};

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
  location?: string;
  htmlLink?: string;
  meetLink?: string;
}

export const getAuthHeaders = (token: string) => {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export interface GoogleAuthResponse {
  token: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number;
  user: User;
}

/**
 * Exchange Google authorization code with the backend for access & refresh tokens.
 */
export const exchangeGoogleAuthCode = async (
  code: string,
  redirectUri: string,
): Promise<GoogleAuthResponse> => {
  try {
    const response = await fetch(`${getApiUrl()}/api/auth/google/code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, redirectUri }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Code exchange failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error exchanging Google code:', error);
    throw error;
  }
};

/**
 * Request a fresh Google access token using the stored refresh token.
 */
export const refreshGoogleAccessToken = async (
  refreshToken: string,
): Promise<{ accessToken: string; expiresIn?: number }> => {
  try {
    const response = await fetch(`${getApiUrl()}/api/auth/google/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Token refresh failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error refreshing Google access token:', error);
    throw error;
  }
};

/**
 * Authenticate with our backend using tokens from client-side PKCE exchange.
 * 
 * The backend verifies the Google idToken to confirm identity, and optionally
 * stores the accessToken for server-side Google API calls. Returns a JWT.
 */
export const authenticateWithGoogle = async (
  accessToken: string,
  idToken?: string,
): Promise<{ token: string; user: User }> => {
  try {
    const response = await fetch(`${getApiUrl()}/api/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken, idToken }),
    });
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Authentication failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error authenticating with Google:', error);
    throw error;
  }
};

/**
 * Fetch calendar events from the backend.
 * 
 * Sends both the app JWT (for auth middleware) and the Google access token
 * (for the backend to call Google Calendar API).
 */
export const fetchCalendarEvents = async (
  token: string,
  googleAccessToken?: string | null,
): Promise<CalendarEvent[]> => {
  try {
    const headers: Record<string, string> = {
      ...getAuthHeaders(token),
    };
    
    // Pass Google access token so backend can call Calendar API
    if (googleAccessToken) {
      headers['X-Google-Access-Token'] = googleAccessToken;
    }

    const response = await fetch(`${getApiUrl()}/api/calendar/events`, {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new Error('SESSION_EXPIRED');
      }
      if (response.status === 403) {
        throw new Error(errData.error || 'Calendar access denied or quota exceeded');
      }
      
      throw new Error(errData.error || `Failed to fetch events with status ${response.status}`);
    }
    
    const data = await response.json();
    // Backend returns { events: [...] }, extract the array
    return data.events;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
};
