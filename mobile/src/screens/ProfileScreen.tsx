/**
 * Profile & Settings Screen
 * Exact replication of official Granola Profile/Settings Screen
 * (Reference: Screenshot_20260908_131653_Granola.jpg)
 */

import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { useMeetingStore } from '../store/useMeetingStore';
import Icon from '../components/Icon';
import { fontFamilies } from '../theme/tokens';

interface ProfileScreenProps {
  onBack: () => void;
}

export default function ProfileScreen({ onBack }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { user: authUser, signOut: authSignOut } = useAuth();
  const { signOut: meetingSignOut } = useMeetingStore();
  const { mode, setMode, colors: themeColors, isDark } = useTheme();

  const [copyAsMarkdown, setCopyAsMarkdown] = useState(true);
  const [notificationTiming, setNotificationTiming] = useState('5 min before');
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  const displayName = authUser?.name || 'Aryan Soni';
  const displayEmail = authUser?.email || 'aryan.s23cs@hood.edu.in';
  const firstName = displayName.split(' ')[0] || 'User';

  const handleSignOut = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await meetingSignOut();
          await authSignOut();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete your account',
      'This will permanently delete your account and remove all synced data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await meetingSignOut();
            await authSignOut();
          },
        },
      ],
    );
  };

  const handleToggleTiming = () => {
    void Haptics.selectionAsync();
    setNotificationTiming((prev) =>
      prev === '5 min before'
        ? '10 min before'
        : prev === '10 min before'
        ? 'At event start'
        : '5 min before',
    );
  };

  const THEME_OPTIONS: Array<{ key: ThemeMode; label: string; desc: string; icon: 'smartphone' | 'moon' | 'sun' }> = [
    { key: 'auto', label: 'Auto (System)', desc: 'Follows your device system appearance', icon: 'smartphone' },
    { key: 'dark', label: 'Dark', desc: 'Deep Slate dark theme', icon: 'moon' },
    { key: 'light', label: 'Light', desc: 'Warm paper clean theme', icon: 'sun' },
  ];

  const currentThemeLabel = mode === 'auto' ? 'Auto' : mode === 'dark' ? 'Dark' : 'Light';

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={themeColors.barStyle} backgroundColor={themeColors.bg} />

      {/* Top Bar with Circular Back Button (Screenshot) */}
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            void Haptics.selectionAsync();
            onBack();
          }}
          style={[styles.backButton, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}
        >
          <Icon name="arrow-left" size={18} color={themeColors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* User Header (Screenshot) */}
        <View style={styles.userHeader}>
          {authUser?.picture ? (
            <Image
              source={{ uri: authUser.picture }}
              style={[styles.userAvatar, { borderColor: themeColors.cardBorder }]}
            />
          ) : (
            <View style={[styles.userAvatarFallback, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
              <Text style={[styles.userAvatarInitial, { color: themeColors.text }]}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={[styles.userName, { color: themeColors.text }]}>{displayName}</Text>
        </View>

        {/* SECTION 1: ACCOUNT (Screenshot) */}
        <View style={styles.sectionGroup}>
          <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>Account</Text>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
            {/* Account Email */}
            <View style={styles.row}>
              <Text style={[styles.rowTitle, { color: themeColors.text }]}>Account</Text>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue} numberOfLines={1}>
                  {displayEmail}
                </Text>
                <Icon name="chevron-right" size={16} color={themeColors.textMuted} style={{ marginLeft: 4 }} />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />

            {/* Default Workspace */}
            <View style={styles.row}>
              <Text style={[styles.rowTitle, { color: themeColors.text }]}>Default workspace</Text>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue} numberOfLines={1}>
                  {firstName}'s Workspace
                </Text>
                <Icon name="chevron-down" size={16} color="#A3E635" style={{ marginLeft: 4 }} />
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />

            {/* Sign Out */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSignOut}
              style={styles.row}
            >
              <Text style={styles.destructiveText}>Sign out</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />

            {/* Delete Account */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleDeleteAccount}
              style={styles.row}
            >
              <Text style={styles.destructiveText}>Delete your account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 2: NOTIFICATIONS (Screenshot) */}
        <View style={styles.sectionGroup}>
          <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>Notifications</Text>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleToggleTiming}
              style={styles.row}
            >
              <Text style={[styles.rowTitle, { color: themeColors.text }]}>Upcoming meetings</Text>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{notificationTiming}</Text>
                <Icon name="chevron-down" size={16} color="#A3E635" style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 3: NOTES (Screenshot) */}
        <View style={styles.sectionGroup}>
          <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>Notes</Text>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
            {/* Folder sync */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => void Haptics.selectionAsync()}
              style={styles.row}
            >
              <Text style={[styles.rowTitle, { color: themeColors.text }]}>Folder sync</Text>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>All notes</Text>
                <Icon name="chevron-down" size={16} color="#A3E635" style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />

            {/* Copy text as Markdown with Lime Toggle */}
            <View style={styles.row}>
              <Text style={[styles.rowTitle, { color: themeColors.text }]}>Copy text as Markdown</Text>
              <Switch
                value={copyAsMarkdown}
                onValueChange={(val) => {
                  void Haptics.selectionAsync();
                  setCopyAsMarkdown(val);
                }}
                trackColor={{ false: '#3A3C44', true: '#A3E635' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#3A3C44"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />

            {/* Trash */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => void Haptics.selectionAsync()}
              style={styles.row}
            >
              <Text style={[styles.rowTitle, { color: themeColors.text }]}>Trash</Text>
              <Icon name="chevron-right" size={16} color={themeColors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 4: CALENDAR (Screenshot) */}
        <View style={styles.sectionGroup}>
          <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>Calendar</Text>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => void Haptics.selectionAsync()}
              style={styles.row}
            >
              <Text style={[styles.rowTitle, { color: themeColors.text }]}>Hidden events</Text>
              <Icon name="chevron-right" size={16} color={themeColors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 5: SHORTCUTS (Screenshot) */}
        <View style={styles.sectionGroup}>
          <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>Shortcuts</Text>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                void Haptics.selectionAsync();
                Alert.alert('Calendar Widget', 'Long-press your home screen to add the Slate Calendar widget.');
              }}
              style={styles.row}
            >
              <Text style={[styles.rowTitle, { color: themeColors.text }]}>Add calendar widget</Text>
              <Icon name="chevron-right" size={16} color={themeColors.textMuted} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                void Haptics.selectionAsync();
                Alert.alert('Quick Settings', 'Swipe down your Android quick settings panel to add the Slate tile.');
              }}
              style={styles.row}
            >
              <Text style={[styles.rowTitle, { color: themeColors.text }]}>Add Quick Settings tile</Text>
              <Icon name="chevron-right" size={16} color={themeColors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SECTION 6: MISC (Screenshot) */}
        <View style={styles.sectionGroup}>
          <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>Misc</Text>
          <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
            {/* Theme selector trigger */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                void Haptics.selectionAsync();
                setThemeModalVisible(true);
              }}
              style={styles.row}
            >
              <Text style={[styles.rowTitle, { color: themeColors.text }]}>Theme</Text>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue}>{currentThemeLabel}</Text>
                <Icon name="chevron-down" size={16} color="#A3E635" style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: themeColors.divider }]} />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                void Haptics.selectionAsync();
                Alert.alert('Contact Us', 'Need support? Reach out at team@slate.app');
              }}
              style={styles.row}
            >
              <Text style={[styles.rowTitle, { color: themeColors.text }]}>Contact us</Text>
              <Icon name="chevron-right" size={16} color={themeColors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Version Footer (Screenshot) */}
        <Text style={[styles.versionFooter, { color: themeColors.textMuted }]}>App version: prod-260828.3</Text>
      </ScrollView>

      {/* Theme Selection Bottom Sheet Modal */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setThemeModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.themeSheet,
                  {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.cardBorder,
                    paddingBottom: insets.bottom + 20,
                  },
                ]}
              >
                {/* Drag / Indicator Handle */}
                <View style={[styles.sheetHandle, { backgroundColor: themeColors.divider }]} />

                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, { color: themeColors.text }]}>Appearance</Text>
                  <TouchableOpacity
                    onPress={() => setThemeModalVisible(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.sheetCloseBtn}
                  >
                    <Icon name="x" size={18} color={themeColors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.themeOptionsList}>
                  {THEME_OPTIONS.map((opt, index) => {
                    const isSelected = mode === opt.key;
                    return (
                      <React.Fragment key={opt.key}>
                        {index > 0 && <View style={[styles.divider, { backgroundColor: themeColors.divider, marginLeft: 48 }]} />}
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            void Haptics.selectionAsync();
                            setMode(opt.key);
                            setThemeModalVisible(false);
                          }}
                          style={[
                            styles.themeOptionRow,
                            isSelected && { backgroundColor: isDark ? '#26282E' : '#F5F5F0' },
                          ]}
                        >
                          <View style={[styles.themeOptionIconBox, { backgroundColor: isSelected ? '#A3E63520' : themeColors.pillBg }]}>
                            <Icon
                              name={opt.icon}
                              size={18}
                              color={isSelected ? '#A3E635' : themeColors.textSecondary}
                            />
                          </View>
                          <View style={styles.themeOptionTextCol}>
                            <Text
                              style={[
                                styles.themeOptionLabel,
                                { color: themeColors.text },
                                isSelected && { fontWeight: '700' },
                              ]}
                            >
                              {opt.label}
                            </Text>
                            <Text style={[styles.themeOptionDesc, { color: themeColors.textMuted }]}>
                              {opt.desc}
                            </Text>
                          </View>
                          {isSelected && (
                            <Icon name="check" size={18} color="#A3E635" />
                          )}
                        </TouchableOpacity>
                      </React.Fragment>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161719', // Granola / Slate Dark BG
  },

  // Top Bar
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#202125',
    borderWidth: 1,
    borderColor: '#2D2E34',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  // User Header (Screenshot)
  userHeader: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 28,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: '#2E3036',
  },
  userAvatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#26272C',
    borderWidth: 1.5,
    borderColor: '#2E3036',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontFamily: fontFamilies.serif,
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 14,
    letterSpacing: -0.3,
  },

  // Section Groups
  sectionGroup: {
    marginBottom: 22,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E929B',
    marginLeft: 6,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#202125',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2A2C31',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '65%',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A3E635', // Lime accent like screenshot
  },
  destructiveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F87171', // Coral/salmon red like screenshot
  },
  divider: {
    height: 1,
    backgroundColor: '#27282E',
    marginLeft: 16,
  },

  // Version Footer
  versionFooter: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 14,
    marginBottom: 20,
  },

  // Theme Sheet Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  themeSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sheetCloseBtn: {
    padding: 6,
  },
  themeOptionsList: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  themeOptionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  themeOptionTextCol: {
    flex: 1,
  },
  themeOptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeOptionDesc: {
    fontSize: 12,
  },
});
