/**
 * Granola Notes & Agenda Screen
 * Exact replication of official Granola Mobile dark-mode UI
 * (Reference: Screenshot_20260908_125056_Granola.jpg, Screenshot_20260908_125105_Granola.jpg, Screenshot_20260908_125108_Granola.jpg)
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MeetingAttendee, MeetingEvent } from '../types/calendar';
import { useMeetingStore } from '../store/useMeetingStore';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Icon from '../components/Icon';
import { fontFamilies } from '../theme/tokens';

const { width } = Dimensions.get('window');

const AVATAR_COLORS = ['#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

interface AgendaScreenProps {
  onOpenDossier?: (meeting: MeetingEvent) => void;
  onStartCopilot?: (meeting: MeetingEvent) => void;
  onOpenProfile?: () => void;
}

export default function AgendaScreen({
  onOpenDossier,
  onStartCopilot,
  onOpenProfile,
}: AgendaScreenProps) {
  const insets = useSafeAreaInsets();
  const { user: authUser, signOut: authSignOut, refreshAccessToken } = useAuth();
  const { colors: themeColors, isDark } = useTheme();
  const {
    events,
    isLoading,
    isRefreshing,
    fetchMeetings,
    isTokenExpired,
    signOut: meetingSignOut,
  } = useMeetingStore();

  const [showMore, setShowMore] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingEvent | null>(null);
  const [showAttendeeDropdown, setShowAttendeeDropdown] = useState(false);
  const [quickMeetingNotes, setQuickMeetingNotes] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    void fetchMeetings(false, refreshAccessToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void fetchMeetings(true, refreshAccessToken);
  };

  const handleSelectMeeting = (meeting: MeetingEvent) => {
    void Haptics.selectionAsync();
    setSelectedMeeting(meeting);
    setShowAttendeeDropdown(false);
    setQuickMeetingNotes('');
  };

  const handleStartNotes = (meeting?: MeetingEvent) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const target = meeting || selectedMeeting || events[0];
    setSelectedMeeting(null);
    if (target && onStartCopilot) {
      onStartCopilot(target);
    } else if (onStartCopilot) {
      // Ad-hoc new note
      const now = new Date();
      const later = new Date(Date.now() + 30 * 60_000);
      const fallbackMeeting: MeetingEvent = {
        id: `adhoc-${Date.now()}`,
        title: 'New Note',
        startDate: now,
        endDate: later,
        startTime: now.toISOString(),
        endTime: later.toISOString(),
        durationMinutes: 30,
        organizer: { email: authUser?.email || '', name: authUser?.name || 'Me' },
        attendees: [],
        platform: 'other',
        description: '',
        isAllDay: false,
        isConfirmed: true,
        isLiveNow: true,
      };
      onStartCopilot(fallbackMeeting);
    }
  };

  // Up to 1 event shown by default; more if showMore is true
  const displayedEvents = showMore ? events : events.slice(0, 1);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={themeColors.barStyle} backgroundColor={themeColors.bg} />

      {/* Top App Bar (Screenshot 1) */}
      <View style={styles.topBar}>
        {/* Left: Folder circular button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => void Haptics.selectionAsync()}
          style={[styles.circleButton, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}
        >
          <Icon name="folder" size={18} color={themeColors.textSecondary} />
        </TouchableOpacity>

        {/* Right: Search + Profile Photo */}
        <View style={styles.topRightActions}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => void Haptics.selectionAsync()}
            style={[styles.circleButton, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}
          >
            <Icon name="search" size={18} color={themeColors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              void Haptics.selectionAsync();
              if (onOpenProfile) {
                onOpenProfile();
              } else {
                setProfileOpen(true);
              }
            }}
            style={[styles.avatarButton, { borderColor: themeColors.cardBorder }]}
          >
            {authUser?.picture ? (
              <Image source={{ uri: authUser.picture }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: themeColors.pillBg }]}>
                <Text style={[styles.avatarFallbackText, { color: themeColors.text }]}>
                  {(authUser?.name || authUser?.email || 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={themeColors.text}
            colors={[themeColors.text]}
          />
        }
      >
        {/* Screen Title: "My notes" (Screenshot 1) */}
        <Text style={[styles.screenTitle, { color: themeColors.text }]}>My notes</Text>

        {/* Expired Token Notice Banner */}
        {isTokenExpired && (
          <View style={[styles.expiredCard, { backgroundColor: themeColors.card, borderColor: '#F59E0B55' }]}>
            <View style={styles.expiredCardContent}>
              <View style={styles.expiredIconBox}>
                <Icon name="alert-circle" size={18} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.expiredTitle, { color: themeColors.text }]}>
                  Calendar session expired
                </Text>
                <Text style={[styles.expiredSubtitle, { color: themeColors.textMuted }]}>
                  Your Google authorization has timed out (1 hr limit). Tap below to reconnect and sync your upcoming meetings.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                await meetingSignOut();
                await authSignOut();
              }}
              style={styles.reconnectBtn}
            >
              <Text style={styles.reconnectBtnText}>Reconnect Google Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* "Coming up" Section (Screenshot 1) */}
        {events.length > 0 && (
          <View style={styles.comingUpSection}>
            <View style={styles.comingUpHeaderRow}>
              <Text style={[styles.comingUpLabel, { color: themeColors.textMuted }]}>Coming up</Text>
              {events.length > 1 && (
                <TouchableOpacity
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setShowMore((prev) => !prev);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.showMoreText, { color: themeColors.textMuted }]}>
                    {showMore ? 'Show less ⇳' : 'Show more ⇳'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Upcoming Meeting Cards (Screenshot 1) */}
            {displayedEvents.map((meeting) => (
              <TouchableOpacity
                key={meeting.id}
                activeOpacity={0.75}
                onPress={() => handleSelectMeeting(meeting)}
                style={[styles.meetingCard, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}
              >
                {/* Date Box: "SEPT" over "11" */}
                <View style={[styles.dateBox, { backgroundColor: themeColors.dateBoxBg }]}>
                  <Text style={[styles.dateMonthText, { color: themeColors.textMuted }]}>
                    {getMonthAbbrev(meeting.startDate)}
                  </Text>
                  <Text style={[styles.dateDayText, { color: themeColors.text }]}>
                    {getDayNumber(meeting.startDate)}
                  </Text>
                </View>

                {/* Meeting Title & Subtitle */}
                <View style={styles.meetingInfo}>
                  <Text style={[styles.meetingTitleText, { color: themeColors.text }]} numberOfLines={1}>
                    {meeting.title}
                  </Text>
                  <Text style={[styles.meetingSubtitleText, { color: themeColors.textMuted }]} numberOfLines={1}>
                    {formatTime12(meeting.startDate)} · {formatAttendeeCount(meeting.attendees.length)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Center Empty State: Angled Notebook Graphic + "No notes yet" (Screenshot 1) */}
        <View style={styles.emptyCenterContainer}>
          <View style={styles.notebookGraphic}>
            {/* Dual isometric sketch pages */}
            <View
              style={[
                styles.notebookSheetBack,
                {
                  borderColor: isDark ? '#383B44' : '#D0CECA',
                  backgroundColor: isDark ? 'transparent' : '#F0EFEA',
                },
              ]}
            />
            <View
              style={[
                styles.notebookSheetFront,
                {
                  borderColor: isDark ? '#4A4D59' : '#BCBAAF',
                  backgroundColor: themeColors.bg,
                },
              ]}
            />
          </View>
          <Text style={[styles.noNotesText, { color: themeColors.textMuted }]}>No notes yet</Text>
        </View>
      </ScrollView>

      {/* Floating Action Button: "✎ New note" (Screenshot 1) */}
      <View
        pointerEvents="box-none"
        style={[styles.floatingBottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handleStartNotes()}
          style={[
            styles.newNoteButton,
            {
              backgroundColor: themeColors.buttonBg,
              shadowColor: isDark ? '#000000' : '#888888',
            },
          ]}
        >
          <Icon name="edit-2" size={17} color={themeColors.buttonText} style={{ marginRight: 8 }} />
          <Text style={[styles.newNoteText, { color: themeColors.buttonText }]}>New note</Text>
        </TouchableOpacity>
      </View>

      {/* Meeting Bottom Sheet Modal (Screenshot 2 & 3) */}
      <Modal
        visible={!!selectedMeeting}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedMeeting(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedMeeting(null)}>
          <View style={styles.sheetOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.sheetContainer,
                  {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.cardBorder,
                    borderTopWidth: 1,
                    paddingBottom: Math.max(insets.bottom, 20),
                  },
                ]}
              >
                {/* Grab Handle */}
                <View style={[styles.sheetHandle, { backgroundColor: themeColors.divider }]} />

                {selectedMeeting && (
                  <>
                    {/* Attendee Popover Card (Screenshot 2) */}
                    {showAttendeeDropdown && (
                      <Animated.View
                        entering={FadeInDown.duration(200)}
                        style={[
                          styles.attendeePopoverCard,
                          {
                            backgroundColor: isDark ? '#25262B' : '#F5F4EE',
                            borderColor: themeColors.cardBorder,
                          },
                        ]}
                      >
                        {/* Event Title & Time Row */}
                        <View style={styles.popoverHeaderRow}>
                          <Icon name="calendar" size={18} color={themeColors.textMuted} />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.popoverTitleText, { color: themeColors.text }]} numberOfLines={1}>
                              {selectedMeeting.title}
                            </Text>
                            <Text style={[styles.popoverTimeText, { color: themeColors.textMuted }]}>
                              {formatTimeRange(
                                selectedMeeting.startDate,
                                selectedMeeting.endDate,
                              )}
                            </Text>
                          </View>
                        </View>

                        <View style={[styles.popoverDivider, { backgroundColor: themeColors.divider }]} />

                        {/* Attendee List */}
                        <ScrollView
                          style={styles.popoverList}
                          showsVerticalScrollIndicator={false}
                        >
                          {selectedMeeting.attendees.length > 0 ? (
                            selectedMeeting.attendees.map((a, i) => (
                              <View key={a.id || i} style={styles.popoverAttendeeRow}>
                                <View
                                  style={[
                                    styles.attendeeAvatarSmall,
                                    {
                                      backgroundColor:
                                        AVATAR_COLORS[i % AVATAR_COLORS.length],
                                    },
                                  ]}
                                >
                                  <Text style={styles.attendeeAvatarInitial}>
                                    {(a.name || a.email || 'A')[0].toUpperCase()}
                                  </Text>
                                </View>
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                  <Text style={[styles.popoverAttendeeName, { color: themeColors.text }]} numberOfLines={1}>
                                    {a.name || a.email.split('@')[0]}
                                    {a.email === authUser?.email ? ' (Me)' : ''}
                                  </Text>
                                  <Text
                                    style={[styles.popoverAttendeeEmail, { color: themeColors.textMuted }]}
                                    numberOfLines={1}
                                  >
                                    {a.email}
                                  </Text>
                                </View>
                              </View>
                            ))
                          ) : (
                            <View style={styles.popoverAttendeeRow}>
                              {authUser?.picture ? (
                                <Image
                                  source={{ uri: authUser.picture }}
                                  style={styles.attendeeAvatarSmall}
                                />
                              ) : (
                                <View
                                  style={[
                                    styles.attendeeAvatarSmall,
                                    { backgroundColor: '#10B981' },
                                  ]}
                                >
                                  <Text style={styles.attendeeAvatarInitial}>
                                    {(authUser?.name || 'Me')[0].toUpperCase()}
                                  </Text>
                                </View>
                              )}
                              <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={[styles.popoverAttendeeName, { color: themeColors.text }]}>
                                  {authUser?.name || 'Me'} (Organizer)
                                </Text>
                                <Text style={[styles.popoverAttendeeEmail, { color: themeColors.textMuted }]}>
                                  {authUser?.email || 'Connected user'}
                                </Text>
                              </View>
                            </View>
                          )}
                        </ScrollView>
                      </Animated.View>
                    )}

                    {/* Large Serif Title (Screenshot 2 & 3) */}
                    <Text style={[styles.sheetTitle, { color: themeColors.text }]}>{selectedMeeting.title}</Text>

                    {/* Date & Attendees Chip (Screenshot 3) */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setShowAttendeeDropdown((prev) => !prev)}
                      style={[
                        styles.sheetChip,
                        {
                          backgroundColor: themeColors.pillBg,
                          borderColor: themeColors.pillBorder,
                        },
                      ]}
                    >
                      <Icon name="calendar" size={14} color={themeColors.textMuted} />
                      <Text style={[styles.sheetChipDate, { color: themeColors.textSecondary }]}>
                        {formatSheetDate(selectedMeeting.startDate)}
                      </Text>

                      {/* Overlapping Avatar Stack */}
                      <View style={styles.avatarStack}>
                        {selectedMeeting.attendees.slice(0, 2).map((a, i) => (
                          <View
                            key={a.id || i}
                            style={[
                              styles.chipAvatar,
                              {
                                marginLeft: i === 0 ? 4 : -6,
                                backgroundColor:
                                  AVATAR_COLORS[i % AVATAR_COLORS.length],
                                borderColor: themeColors.card,
                              },
                            ]}
                          >
                            <Text style={styles.chipAvatarText}>
                              {(a.name || a.email || 'A')[0].toUpperCase()}
                            </Text>
                          </View>
                        ))}
                        {authUser?.picture ? (
                          <Image
                            source={{ uri: authUser.picture }}
                            style={[styles.chipAvatar, { marginLeft: -6, borderColor: themeColors.card }]}
                          />
                        ) : null}
                      </View>
                    </TouchableOpacity>

                    {/* "Add your notes here" Placeholder (Screenshot 2 & 3) */}
                    <TextInput
                      value={quickMeetingNotes}
                      onChangeText={setQuickMeetingNotes}
                      placeholder="Add your notes here"
                      placeholderTextColor={themeColors.textMuted}
                      style={[styles.sheetNotesInput, { color: themeColors.text }]}
                      multiline
                    />

                    {/* "Start notes" White Pill Button (Screenshot 2 & 3) */}
                    <TouchableOpacity
                      activeOpacity={0.88}
                      onPress={() => handleStartNotes(selectedMeeting)}
                      style={[styles.startNotesButton, { backgroundColor: themeColors.buttonBg }]}
                    >
                      <Text style={[styles.startNotesText, { color: themeColors.buttonText }]}>Start notes</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Account Profile Sheet */}
      <Modal
        visible={profileOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setProfileOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setProfileOpen(false)}>
          <View style={styles.profileOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.profileCard}>
                <View style={styles.profileHeader}>
                  {authUser?.picture ? (
                    <Image
                      source={{ uri: authUser.picture }}
                      style={styles.profileLargeAvatar}
                    />
                  ) : (
                    <View style={styles.profileLargeAvatarFallback}>
                      <Text style={styles.profileLargeAvatarText}>
                        {(authUser?.name || authUser?.email || 'U')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.profileName}>
                    {authUser?.name || 'Google Account'}
                  </Text>
                  <Text style={styles.profileEmail}>{authUser?.email}</Text>
                </View>

                <TouchableOpacity
                  style={styles.profileSyncBtn}
                  onPress={() => {
                    handleRefresh();
                    setProfileOpen(false);
                  }}
                >
                  <Icon name="refresh-cw" size={14} color="#D1D5DB" />
                  <Text style={styles.profileSyncText}>Sync Calendar Events</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileSignOutBtn}
                  onPress={async () => {
                    setProfileOpen(false);
                    await meetingSignOut();
                    await authSignOut();
                  }}
                >
                  <Text style={styles.profileSignOutText}>Sign out</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.profileCloseBtn}
                  onPress={() => setProfileOpen(false)}
                >
                  <Text style={styles.profileCloseText}>Done</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Date / Time Formatters                                              */
/* ------------------------------------------------------------------ */

function getMonthAbbrev(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

function getDayNumber(date: Date): string {
  return date.getDate().toString();
}

function formatTime12(date: Date): string {
  return date
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase();
}

function formatAttendeeCount(count: number): string {
  if (count <= 1) return '1 attendee';
  return `${count} attendees`;
}

function formatSheetDate(date: Date): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const time = formatTime12(date);
  return `${month} ${day}, ${time}`;
}

function formatTimeRange(start: Date, end: Date): string {
  const weekday = start.toLocaleDateString('en-US', { weekday: 'short' });
  const day = start.getDate();
  const month = start.toLocaleDateString('en-US', { month: 'short' });
  const startTime = start
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: start.getMinutes() === 0 ? undefined : '2-digit',
      hour12: true,
    })
    .toLowerCase();
  const endTime = end
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: end.getMinutes() === 0 ? undefined : '2-digit',
      hour12: true,
    })
    .toLowerCase();
  return `${weekday} ${day} ${month} ${startTime} - ${endTime}`;
}

/* ------------------------------------------------------------------ */
/* Stylesheet                                                          */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161719', // Granola Dark Screen BG
  },

  // Top Bar (Screenshot 1)
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#202125',
    borderWidth: 1,
    borderColor: '#2D2E34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2D2E34',
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    backgroundColor: '#2E3036',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Scroll Content
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  // Title: "My notes"
  screenTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 34,
    fontWeight: '600',
    color: '#F3F4F6',
    marginTop: 14,
    marginBottom: 24,
    letterSpacing: -0.4,
  },

  // Expired Card
  expiredCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  expiredCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  expiredIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  expiredTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  expiredSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  reconnectBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reconnectBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },

  // "Coming up" Section (Screenshot 1)
  comingUpSection: {
    marginBottom: 32,
  },
  comingUpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  comingUpLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E929B',
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E929B',
  },

  // Meeting Card (Screenshot 1)
  meetingCard: {
    backgroundColor: '#202125',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2A2C31',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  dateBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#2A2B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonthText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.6,
  },
  dateDayText: {
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
  },
  meetingInfo: {
    flex: 1,
  },
  meetingTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  meetingSubtitleText: {
    fontSize: 13,
    color: '#8E929B',
    marginTop: 3,
  },

  // Center Empty State: Angled Notebook Sketch (Screenshot 1)
  emptyCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 90,
  },
  notebookGraphic: {
    width: 80,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  notebookSheetBack: {
    position: 'absolute',
    width: 58,
    height: 40,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#383B44',
    transform: [{ rotate: '-18deg' }, { skewX: '-22deg' }, { translateX: -4 }, { translateY: -4 }],
  },
  notebookSheetFront: {
    position: 'absolute',
    width: 58,
    height: 40,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4A4D59',
    backgroundColor: '#161719',
    transform: [{ rotate: '-18deg' }, { skewX: '-22deg' }, { translateX: 2 }, { translateY: 2 }],
  },
  noNotesText: {
    fontSize: 16,
    color: '#8E929B',
    fontWeight: '400',
  },

  // Floating Action Button: "✎ New note" (Screenshot 1)
  floatingBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  newNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 56,
    borderRadius: 28,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  newNoteText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },

  // Bottom Sheet Modal (Screenshots 2 & 3)
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#1C1D21',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3C44',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 27,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 35,
    marginTop: 4,
    marginBottom: 14,
  },
  sheetChip: {
    backgroundColor: '#26272C',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#34363E',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  sheetChipDate: {
    fontSize: 13,
    fontWeight: '500',
    color: '#D1D5DB',
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#26272C',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chipAvatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetNotesInput: {
    fontSize: 17,
    color: '#F3F4F6',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  startNotesButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  startNotesText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },

  // Attendee Popover Card (Screenshot 2)
  attendeePopoverCard: {
    backgroundColor: '#25262B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#35373F',
    padding: 14,
    marginBottom: 16,
  },
  popoverHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popoverTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  popoverTimeText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  popoverDivider: {
    height: 1,
    backgroundColor: '#32343C',
    marginVertical: 12,
  },
  popoverList: {
    maxHeight: 180,
  },
  popoverAttendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  attendeeAvatarSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  attendeeAvatarInitial: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  popoverAttendeeName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  popoverAttendeeEmail: {
    fontSize: 11,
    color: '#8E929B',
    marginTop: 1,
  },

  // Profile Card Modal
  profileOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  profileCard: {
    width: '100%',
    backgroundColor: '#202125',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2F3138',
    padding: 24,
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileLargeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
  },
  profileLargeAvatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2F3138',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileLargeAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: '#8E929B',
  },
  profileSyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#2A2B31',
    borderRadius: 999,
    marginBottom: 12,
  },
  profileSyncText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  profileSignOutBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  profileSignOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  profileCloseBtn: {
    paddingVertical: 10,
  },
  profileCloseText: {
    fontSize: 14,
    color: '#8E929B',
  },
});
