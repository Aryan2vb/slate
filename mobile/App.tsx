import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import CommandCenterScreen from './src/screens/CommandCenterScreen';
import DossierScreen from './src/screens/DossierScreen';
import LiveCopilotScreen from './src/screens/LiveCopilotScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { Meeting } from './src/data/meetings';
import { Objective } from './src/data/intel';
import { colors, fontFamilies, radius, space } from './src/theme/tokens';

import AgendaScreen from './src/screens/AgendaScreen';
import { MeetingEvent } from './src/types/calendar';
import { useMeetingStore } from './src/store/useMeetingStore';

function meetingEventToMeeting(ev: MeetingEvent): Meeting {
  return {
    id: ev.id,
    title: ev.title,
    org: ev.organizer.name,
    startTime: ev.startDate,
    endTime: ev.endDate,
    tags: [
      ev.platform === 'google_meet'
        ? 'Google Meet'
        : ev.platform === 'zoom'
        ? 'Zoom'
        : ev.platform === 'teams'
        ? 'Teams'
        : 'Executive',
    ],
    people: ev.attendees.map((a) => ({
      id: a.id,
      name: a.name,
      avatarUrl: a.avatarUrl,
    })),
    location: ev.location || ev.meetUrl,
    description: ev.description,
  };
}

/**
 * Multi-step flow: Agenda -> Pre-Meeting Dossier -> Live Copilot -> Editorial Desk
 */
type Route =
  | { name: 'agenda' }
  | { name: 'profile' }
  | { name: 'command' }
  | { name: 'dossier'; meeting: Meeting }
  | { name: 'live'; meeting: Meeting; objectives: Objective[] };

function Flow() {
  const [route, setRoute] = useState<Route>({ name: 'agenda' });

  switch (route.name) {
    case 'profile':
      return (
        <Animated.View key="profile" entering={FadeIn.duration(200)} style={styles.fill}>
          <ProfileScreen onBack={() => setRoute({ name: 'agenda' })} />
        </Animated.View>
      );

    case 'dossier':
      return (
        <Animated.View key="dossier" entering={FadeIn.duration(220)} style={styles.fill}>
          <DossierScreen
            meeting={route.meeting}
            onBack={() => setRoute({ name: 'agenda' })}
            onStart={(objectives) =>
              setRoute({ name: 'live', meeting: route.meeting, objectives })
            }
          />
        </Animated.View>
      );

    case 'live':
      return (
        <Animated.View key="live" entering={FadeIn.duration(220)} style={styles.fill}>
          <LiveCopilotScreen
            meeting={route.meeting}
            objectives={route.objectives}
            onEnd={() => setRoute({ name: 'agenda' })}
          />
        </Animated.View>
      );

    case 'command':
      return (
        <Animated.View key="command" entering={FadeIn.duration(220)} style={styles.fill}>
          <CommandCenterScreen
            onOpenMeeting={(meeting) => setRoute({ name: 'dossier', meeting })}
          />
        </Animated.View>
      );

    default:
      return (
        <Animated.View key="agenda" entering={FadeIn.duration(220)} style={styles.fill}>
          <AgendaScreen
            onOpenProfile={() => setRoute({ name: 'profile' })}
            onOpenDossier={(meetingEvent) =>
              setRoute({ name: 'dossier', meeting: meetingEventToMeeting(meetingEvent) })
            }
            onStartCopilot={(meetingEvent) =>
              setRoute({
                name: 'live',
                meeting: meetingEventToMeeting(meetingEvent),
                objectives: [],
              })
            }
          />
        </Animated.View>
      );
  }
}

function AppContent() {
  const { user, googleAccessToken, googleRefreshToken, refreshAccessToken, isLoading } = useAuth();
  const setSession = useMeetingStore((s) => s.setSession);
  const setTokenRefreshHandler = useMeetingStore((s) => s.setTokenRefreshHandler);

  useEffect(() => {
    if (refreshAccessToken) {
      setTokenRefreshHandler(refreshAccessToken);
    }
  }, [refreshAccessToken, setTokenRefreshHandler]);

  useEffect(() => {
    if (user && googleAccessToken) {
      void setSession(
        { accessToken: googleAccessToken, refreshToken: googleRefreshToken || undefined },
        { id: user.id, email: user.email, name: user.name || user.email.split('@')[0] }
      );
    }
  }, [user, googleAccessToken, googleRefreshToken, setSession]);

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return user ? <Flow /> : <LoginScreen />;
}

function ThemedShell({ children }: { children: React.ReactNode }) {
  const { colors, isDark } = useTheme();
  return (
    <View style={[styles.fill, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg}
      />
      {children}
    </View>
  );
}

export default function App() {
  const { width, height } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width > 540;

  const appContent = (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedShell>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemedShell>
      </ThemeProvider>
    </SafeAreaProvider>
  );

  // If viewed on a mobile device or native emulator, fill 100%
  if (!isDesktopWeb) {
    return appContent;
  }

  // If viewed on a laptop / desktop browser, center inside a sleek mobile phone frame
  const frameHeight = Math.min(height - 110, 844);

  return (
    <View style={styles.desktopCanvas}>
      {/* Top Banner on Laptop */}
      <View style={styles.desktopBanner}>
        <View style={styles.bannerRow}>
          <Text style={styles.bannerTitle}>Slate</Text>
        </View>
        <Text style={styles.bannerSub}>
          Clean, blank, and ready for thoughts.
        </Text>
      </View>

      {/* Sleek Smartphone Mockup Frame */}
      <View style={[styles.phoneFrame, { height: frameHeight }]}>
        {/* Dynamic Island Pill */}
        <View style={styles.dynamicIsland} />
        <View style={styles.phoneScreen}>
          {appContent}
        </View>
      </View>
    </View>
  );
}

registerRootComponent(App);

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: '#161719',
  },
  splash: {
    flex: 1,
    backgroundColor: '#161719',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Desktop Laptop Preview Shell
  desktopCanvas: {
    flex: 1,
    backgroundColor: '#F4F3EE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  desktopBanner: {
    alignItems: 'center',
    marginBottom: 14,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  bannerTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  bannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentTint,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    gap: 6,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  bannerPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
  },
  bannerSub: {
    fontSize: 12,
    color: colors.textMuted,
  },

  // Smartphone Frame
  phoneFrame: {
    width: 395,
    borderRadius: 50,
    backgroundColor: '#1E2320',
    borderWidth: 8,
    borderColor: '#262C28',
    overflow: 'hidden',
    shadowColor: '#1F2421',
    shadowOpacity: 0.22,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 16 },
    elevation: 20,
    position: 'relative',
  },
  dynamicIsland: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    width: 96,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    zIndex: 9999,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: '#161719',
    borderRadius: 42,
    overflow: 'hidden',
  },
});
