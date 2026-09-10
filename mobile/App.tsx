import React, { useEffect } from 'react';
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

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import RootNavigator from './src/navigation/RootNavigator';
import { useMeetingStore } from './src/store/useMeetingStore';
import { colors, fontFamilies, radius } from './src/theme/tokens';

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

  return user ? <RootNavigator /> : <LoginScreen />;
}

function ThemedShell({ children }: { children: React.ReactNode }) {
  const { colors: currentColors, isDark } = useTheme();
  return (
    <View style={[styles.fill, { backgroundColor: currentColors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={currentColors.bg}
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

  // Native devices & mobile emulators fill 100%
  if (!isDesktopWeb) {
    return appContent;
  }

  // Desktop web browser preview shell
  const frameHeight = Math.min(height - 110, 844);

  return (
    <View style={styles.desktopCanvas}>
      <View style={styles.desktopBanner}>
        <View style={styles.bannerRow}>
          <Text style={styles.bannerTitle}>Slate</Text>
        </View>
        <Text style={styles.bannerSub}>Clean, blank, and ready for thoughts.</Text>
      </View>

      <View style={[styles.phoneFrame, { height: frameHeight }]}>
        <View style={styles.dynamicIsland} />
        <View style={styles.phoneScreen}>{appContent}</View>
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
  bannerSub: {
    fontSize: 12,
    color: colors.textMuted,
  },
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
