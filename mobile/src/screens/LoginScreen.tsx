import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Google from 'expo-auth-session/providers/google';
import { AuthRequest, ResponseType } from 'expo-auth-session';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

import { useAuth } from '../context/AuthContext';
import { exchangeGoogleAuthCode, getApiUrl } from '../services/api';
import GlassSheet from '../components/GlassSheet';
import Icon from '../components/Icon';
import PressableScale from '../components/PressableScale';
import { colors, fontFamilies, radius, space } from '../theme/tokens';
import { GoogleLogo, SlateLogo } from '../components/BrandLogos';

// Completes the auth session when control returns from the browser.
WebBrowser.maybeCompleteAuthSession();

/**
 * Slate Warm Paper Login Screen.
 *
 * Supports both Google OAuth and 1-tap "Explore without Login"
 * so reviewers or Expo Go users can instantly experience the full app.
 */
export default function LoginScreen() {
  const { signIn, setSession } = useAuth();
  const insets = useSafeAreaInsets();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explainerOpen, setExplainerOpen] = useState(false);

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: webClientId,
    webClientId,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || webClientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || webClientId,
    scopes: [
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar.events.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    extraParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  });

  const handleAuthRedirectUrl = async (url: string): Promise<boolean> => {
    try {
      const hashMatch = url.match(/#([^#]+)$/);
      const queryMatch = url.match(/\?([^#]+)/);
      const searchStr = (hashMatch ? hashMatch[1] : '') + '&' + (queryMatch ? queryMatch[1] : '');
      const params = new URLSearchParams(searchStr);

      const err = params.get('error');
      if (err) {
        setError(decodeURIComponent(err));
        setIsSigningIn(false);
        return true;
      }

      // 1. Check for complete backend session (token, accessToken, user)
      const token = params.get('token');
      const accessToken = params.get('accessToken');
      const refreshToken = params.get('refreshToken');
      const userStr = params.get('user');

      if (token && accessToken) {
        let userObj = null;
        if (userStr) {
          try {
            userObj = JSON.parse(decodeURIComponent(userStr));
          } catch {
            userObj = null;
          }
        }
        if (userObj) {
          await setSession(token, userObj, accessToken, refreshToken);
          return true;
        }
      }

      // 2. Check for authorization code to exchange
      const code = params.get('code');
      if (code) {
        const proxyRedirectUri = 'https://auth.expo.io/@aryan2vb/granola';
        const authData = await exchangeGoogleAuthCode(code, proxyRedirectUri);
        if (authData.accessToken) {
          await handleSignIn(authData.accessToken, undefined, authData.refreshToken);
          return true;
        }
      }

      // 3. Fallback: check for access_token directly
      const directAccessToken = params.get('access_token');
      const idToken = params.get('id_token') || undefined;
      if (directAccessToken) {
        await handleSignIn(directAccessToken, idToken, refreshToken);
        return true;
      }

      return false;
    } catch (e: any) {
      console.error('Error handling auth redirect url:', e);
      setError(e?.message || 'Authentication error');
      setIsSigningIn(false);
      return false;
    }
  };

  useEffect(() => {
    // Listen for deep links when returning from browser
    const subscription = Linking.addEventListener('url', (event) => {
      if (event.url && (event.url.includes('auth') || event.url.includes('granola'))) {
        void handleAuthRedirectUrl(event.url);
      }
    });

    // Check cold launch URL
    void Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl && (initialUrl.includes('auth') || initialUrl.includes('granola'))) {
        void handleAuthRedirectUrl(initialUrl);
      }
    });

    return () => {
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const authentication = response.authentication;
      const accessToken = authentication?.accessToken;
      const idToken = authentication?.idToken || response.params?.id_token;
      const refreshToken = authentication?.refreshToken || response.params?.refresh_token;

      if (accessToken) {
        void handleSignIn(accessToken, idToken, refreshToken);
      } else {
        const paramAccessToken = response.params?.access_token;
        if (paramAccessToken) {
          void handleSignIn(paramAccessToken, idToken, refreshToken);
        } else {
          setError('Google did not return an access token. Please try again.');
        }
      }
    } else if (response?.type === 'error') {
      const errorMsg = response.error?.message || 'Google authorization failed.';
      setError(`${errorMsg} You can tap "Explore without Login" below.`);
    } else if (response?.type === 'cancel') {
      setError('Google authorization was cancelled. You can tap "Explore without Login" below.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const handleSignIn = async (
    accessToken: string,
    idToken?: string | null,
    refreshToken?: string | null,
  ) => {
    setIsSigningIn(true);
    setError(null);
    try {
      await signIn(accessToken, idToken || undefined, refreshToken);
    } catch (err: any) {
      setIsSigningIn(false);
      setError(err?.message || 'Authentication failed with Google.');
    }
  };

  const startGoogleAuth = async () => {
    setIsSigningIn(true);
    setError(null);

    // On Web: native Google useAuthRequest works with http://localhost:8081
    if (Platform.OS === 'web') {
      try {
        await promptAsync();
      } catch (err: any) {
        setIsSigningIn(false);
        setError(err?.message || 'Web login failed');
      }
      return;
    }

    const apiUrl = getApiUrl();
    const isLocalBackend = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1') || apiUrl.includes('10.7.26.227');

    // If deployed backend URL is configured, use the universal backend OAuth bridge
    if (!isLocalBackend) {
      try {
        const authUrl = `${apiUrl}/api/auth/google/start?redirect_scheme=granola`;
        const result = await WebBrowser.openAuthSessionAsync(authUrl, 'granola://');

        if (result.type === 'success' && result.url) {
          const handled = await handleAuthRedirectUrl(result.url);
          if (handled) return;
        } else if (result.type === 'cancel') {
          setIsSigningIn(false);
          return;
        }
      } catch (backendAuthErr) {
        console.warn('Backend OAuth bridge attempt failed, trying fallback:', backendAuthErr);
      }
    }

    // Expo Go / Local Fallback via Expo Auth Proxy
    try {
      const proxyRedirectUri = 'https://auth.expo.io/@aryan2vb/granola';
      const authRequest = new AuthRequest({
        clientId: webClientId!,
        redirectUri: proxyRedirectUri,
        scopes: [
          'openid',
          'email',
          'profile',
          'https://www.googleapis.com/auth/calendar.events.readonly',
          'https://www.googleapis.com/auth/calendar.events',
        ],
        responseType: ResponseType.Code,
        extraParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        usePKCE: false,
      });

      const googleAuthUrl = await authRequest.makeAuthUrlAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      const returnUrl = Linking.createURL('expo-auth-session');
      const startUrl = `https://auth.expo.io/@aryan2vb/granola/start?${new URLSearchParams({
        authUrl: googleAuthUrl,
        returnUrl,
      }).toString()}`;

      const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);

      if (result.type === 'success' && result.url) {
        const handled = await handleAuthRedirectUrl(result.url);
        if (handled) return;

        setError('No authorization code or token returned from Google. Please try again.');
      } else if (result.type === 'cancel') {
        setError('Google authorization was cancelled.');
      }
    } catch (proxyErr: any) {
      console.error('Expo proxy auth error:', proxyErr);
      setError(proxyErr?.message || 'Failed to start Google sign in.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xxl }]}>
        {/* Brand Block */}
        <Animated.View entering={FadeInDown.duration(450)} style={styles.brandBlock}>
          <View style={styles.logoContainer}>
            <SlateLogo size={70} />
          </View>

          <Text style={styles.wordmark}>Slate</Text>
          <Text style={styles.tagline}>
            Clean, blank, and ready for thoughts.
          </Text>
          <Text style={styles.description}>
            Your ambient AI executive copilot — turning real-time conversations into structured intelligence, notes, and action items effortlessly.
          </Text>

          {/* Value Pillars */}
          <View style={styles.pillRow}>
            <View style={styles.featurePill}>
              <Icon name="mic" size={12} color="#10B981" />
              <Text style={styles.featurePillText}>Live Copilot</Text>
            </View>
            <View style={styles.featurePill}>
              <Icon name="calendar" size={12} color="#38BDF8" />
              <Text style={styles.featurePillText}>Calendar Sync</Text>
            </View>
            <View style={styles.featurePill}>
              <Icon name="zap" size={12} color="#F59E0B" />
              <Text style={styles.featurePillText}>Smart Dossiers</Text>
            </View>
          </View>
        </Animated.View>

        {/* Actions Block */}
        <Animated.View entering={FadeInDown.duration(450).delay(120)} style={styles.actions}>
          {isSigningIn ? (
            <View style={styles.signingIn}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.signingInText}>Opening your desk…</Text>
            </View>
          ) : (
            <>
              {/* Primary Google Login */}
              <PressableScale
                haptic="primary"
                onPress={() => setExplainerOpen(true)}
                disabled={isSigningIn}
                style={styles.cta}
              >
                <GoogleLogo size={20} />
                <Text style={styles.ctaText}>Continue with Google</Text>
              </PressableScale>
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.footnote}>
            Sign in with your Google account to sync your calendar.
          </Text>
        </Animated.View>
      </View>

      {/* Permission Explainer Sheet */}
      <GlassSheet
        visible={explainerOpen}
        onClose={() => setExplainerOpen(false)}
        title="Connect Google Calendar"
        subtitle="Slate reads your upcoming agenda to prepare your desk before meetings start."
      >
        <View style={styles.scopeList}>
          <ScopeRow label="Read your calendar events" detail="calendar.events.readonly" />
          <ScopeRow label="Create & update events" detail="calendar.events" />
          <ScopeRow label="Your name and email address" detail="profile · email" />
        </View>

        <PressableScale
          haptic="primary"
          onPress={() => {
            setExplainerOpen(false);
            setTimeout(() => {
              void startGoogleAuth();
            }, 260);
          }}
          style={styles.cta}
        >
          <GoogleLogo size={20} />
          <Text style={styles.ctaText}>Continue with Google</Text>
        </PressableScale>
      </GlassSheet>
    </View>
  );
}

function ScopeRow({ label, detail }: { label: string; detail: string }) {
  return (
    <View style={styles.scopeRow}>
      <View style={styles.scopeDot} />
      <View style={{ flex: 1 }}>
        <Text style={styles.scopeLabel}>{label}</Text>
        <Text style={styles.scopeDetail}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161719',
  },
  content: {
    flex: 1,
    paddingHorizontal: space.xxl,
    justifyContent: 'space-between',
  },
  brandBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: space.lg,
  },
  wordmark: {
    fontFamily: fontFamilies.serif,
    fontSize: 42,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#E4E4E7',
    fontWeight: '500',
    marginBottom: space.sm,
  },
  description: {
    fontSize: 14,
    color: '#A1A1AA',
    lineHeight: 21,
    maxWidth: 340,
    marginBottom: space.xl,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: space.lg,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#202125',
    borderWidth: 1,
    borderColor: '#2E3038',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  featurePillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D4D4D8',
  },

  actions: {
    paddingBottom: space.lg,
    gap: space.md,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.pill,
    paddingVertical: space.lg,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  guestCta: {
    alignItems: 'center',
    paddingVertical: space.sm,
  },
  guestCtaText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    textDecorationLine: 'underline',
  },

  signingIn: {
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.lg,
  },
  signingInText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  error: {
    fontSize: 12,
    color: colors.live,
    backgroundColor: colors.liveTint,
    borderWidth: 1,
    borderColor: colors.liveBorder,
    borderRadius: radius.sm,
    padding: space.md,
    lineHeight: 17,
  },
  footnote: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },

  scopeList: {
    gap: space.lg,
    marginBottom: space.xl,
  },
  scopeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  scopeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 7,
  },
  scopeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  scopeDetail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  sheetGuestBtn: {
    alignItems: 'center',
    paddingVertical: space.md,
  },
  sheetGuestBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
