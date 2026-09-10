import React, { useEffect, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { MeetingEvent } from '../../../types/calendar';
import Icon from '../../../components/Icon';
import { colors, fontFamilies } from '../../../theme/tokens';
import {
  formatMeetingTimeRange,
  formatTimeRange,
} from '../utils/dateUtils';
import { AVATAR_COLORS } from './AttendeesModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface MeetingBottomSheetProps {
  meeting: MeetingEvent | null;
  showAttendeeDropdown: boolean;
  setShowAttendeeDropdown: (val: boolean | ((prev: boolean) => boolean)) => void;
  quickMeetingNotes: string;
  setQuickMeetingNotes: (val: string) => void;
  authUser: { email?: string; name?: string; picture?: string } | null;
  themeColors: any;
  isDark: boolean;
  insetsBottom: number;
  onOpenAttendeeModal: (meeting: MeetingEvent) => void;
  onOpenMeetingUrl: (meeting: MeetingEvent) => void;
  onStartNotes: (meeting?: MeetingEvent) => void;
  onClose: () => void;
}

export default function MeetingBottomSheet({
  meeting,
  showAttendeeDropdown,
  setShowAttendeeDropdown,
  quickMeetingNotes,
  setQuickMeetingNotes,
  authUser,
  themeColors,
  isDark,
  insetsBottom,
  onOpenAttendeeModal,
  onOpenMeetingUrl,
  onStartNotes,
  onClose,
}: MeetingBottomSheetProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const onShow = (e: any) => {
      const height = e?.endCoordinates?.height || 0;
      setKeyboardHeight(height);
    };
    const onHide = () => {
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      onShow
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      onHide
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (!meeting) return null;

  const safeBottomPadding = Math.max(insetsBottom, 28) + 16;

  const enterEditingMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsEditingNotes(true);
  };

  const exitEditingMode = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Keyboard.dismiss();
    setIsEditingNotes(false);
  };

  const handleClose = () => {
    setIsEditingNotes(false);
    onClose();
  };

  return (
    <Modal
      visible={!!meeting}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetOverlay}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <Animated.View
            entering={SlideInDown.springify().damping(24).stiffness(200)}
            exiting={SlideOutDown.duration(200)}
            layout={LinearTransition.duration(260)}
            style={[
              styles.sheetContainer,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.cardBorder,
                borderTopWidth: 1,
                paddingBottom: keyboardHeight > 0 ? 16 : safeBottomPadding,
                marginBottom: keyboardHeight,
              },
            ]}
          >
            {/* Grab Handle & Details Toggle Bar */}
            <View style={styles.sheetHeaderBar}>
              <View style={[styles.sheetHandle, { backgroundColor: themeColors.divider }]} />
              {isEditingNotes && (
                <TouchableOpacity
                  onPress={exitEditingMode}
                  style={styles.collapseEditingBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="check" size={14} color={themeColors.accent || colors.accent} />
                  <Text style={[styles.collapseEditingText, { color: themeColors.accent || colors.accent, fontWeight: '600' }]}>
                    Done
                  </Text>
                </TouchableOpacity>
              )}
            </View>

              {/* Attendee Popover Card */}
              {showAttendeeDropdown && !isEditingNotes && (
                <Animated.View
                  entering={FadeInDown.duration(200)}
                  exiting={FadeOut.duration(180)}
                  style={[
                    styles.attendeePopoverCard,
                    {
                      backgroundColor: isDark ? '#25262B' : '#F5F4EE',
                      borderColor: themeColors.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.popoverHeaderRow}>
                    <Icon name="calendar" size={18} color={themeColors.textMuted} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text
                        style={[styles.popoverTitleText, { color: themeColors.text }]}
                        numberOfLines={1}
                      >
                        {meeting.title}
                      </Text>
                      <Text style={[styles.popoverTimeText, { color: themeColors.textMuted }]}>
                        {formatTimeRange(meeting.startDate, meeting.endDate)}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[styles.popoverDivider, { backgroundColor: themeColors.divider }]}
                  />

                  <ScrollView style={styles.popoverList} showsVerticalScrollIndicator={false}>
                    {meeting.attendees.length > 0 ? (
                      meeting.attendees.map((a, i) => (
                        <View key={a.id || i} style={styles.popoverAttendeeRow}>
                          <View
                            style={[
                              styles.attendeeAvatarSmall,
                              {
                                backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                              },
                            ]}
                          >
                            <Text style={styles.attendeeAvatarInitial}>
                              {(a.name || a.email || 'A')[0].toUpperCase()}
                            </Text>
                          </View>
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text
                              style={[styles.popoverAttendeeName, { color: themeColors.text }]}
                              numberOfLines={1}
                            >
                              {a.name || a.email}
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
                            style={[styles.attendeeAvatarSmall, { backgroundColor: '#10B981' }]}
                          >
                            <Text style={styles.attendeeAvatarInitial}>
                              {(authUser?.name || 'Me')[0].toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text
                            style={[styles.popoverAttendeeName, { color: themeColors.text }]}
                          >
                            {authUser?.name || 'Me'} (Organizer)
                          </Text>
                          <Text
                            style={[styles.popoverAttendeeEmail, { color: themeColors.textMuted }]}
                          >
                            {authUser?.email || 'Connected user'}
                          </Text>
                        </View>
                      </View>
                    )}
                  </ScrollView>
                </Animated.View>
              )}

              {/* Full Title - ALWAYS VISIBLE */}
              <Animated.View layout={LinearTransition.duration(260)}>
                <Text
                  style={[
                    styles.sheetTitle,
                    isEditingNotes && styles.sheetTitleEditing,
                    { color: themeColors.text },
                  ]}
                  numberOfLines={2}
                >
                  {meeting.title}
                </Text>
              </Animated.View>

              {/* Chips Row: Date & Attendees + Location (collapsed in editing mode) */}
              {!isEditingNotes && (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(160)}
                  layout={LinearTransition.duration(260)}
                >
                  <View style={styles.sheetChipsRow}>
                    {/* Date & Attendees Chip */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        onOpenAttendeeModal(meeting);
                      }}
                      style={[
                        styles.sheetChip,
                        {
                          backgroundColor: themeColors.pillBg,
                          borderColor: themeColors.pillBorder,
                        },
                      ]}
                    >
                      <Icon name="calendar" size={13} color={themeColors.textMuted} />
                      <Text style={[styles.sheetChipDate, { color: themeColors.textSecondary }]}>
                        {formatMeetingTimeRange(meeting.startDate, meeting.endDate)}
                      </Text>

                      {/* Overlapping Avatar Stack */}
                      <View style={styles.avatarStack}>
                        {meeting.attendees.slice(0, 2).map((a, i) => (
                          <View
                            key={a.id || i}
                            style={[
                              styles.chipAvatar,
                              {
                                marginLeft: i === 0 ? 4 : -6,
                                backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
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
                            style={[
                              styles.chipAvatar,
                              { marginLeft: -6, borderColor: themeColors.card },
                            ]}
                          />
                        ) : null}
                      </View>
                    </TouchableOpacity>

                    {/* Meeting Location Chip in Sheet */}
                    {(meeting.location || meeting.meetUrl) && (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => onOpenMeetingUrl(meeting)}
                        style={[
                          styles.sheetLocationChip,
                          {
                            backgroundColor: themeColors.pillBg,
                            borderColor: themeColors.pillBorder,
                          },
                        ]}
                      >
                        <Icon
                          name={meeting.meetUrl ? 'video' : 'map-pin'}
                          size={12}
                          color={
                            meeting.meetUrl
                              ? isDark
                                ? '#93C5FD'
                                : '#2563EB'
                              : themeColors.textMuted
                          }
                        />
                        <Text
                          style={[
                            styles.sheetLocationText,
                            {
                              color: meeting.meetUrl
                                ? isDark
                                  ? '#93C5FD'
                                  : '#2563EB'
                                : themeColors.textSecondary,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {meeting.location ||
                            (meeting.platform === 'google_meet'
                              ? 'Google Meet'
                              : meeting.platform === 'zoom'
                              ? 'Zoom'
                              : 'Virtual meeting')}
                        </Text>
                        <Icon
                          name="external-link"
                          size={10}
                          color={
                            meeting.meetUrl
                              ? isDark
                                ? '#93C5FD'
                                : '#2563EB'
                              : themeColors.textMuted
                          }
                          style={{ marginLeft: 2 }}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </Animated.View>
              )}

              {/* Notes Input - Smoothly expands to top with visible cursor */}
              <Animated.View layout={LinearTransition.duration(260)}>
                <TextInput
                  value={quickMeetingNotes}
                  onChangeText={setQuickMeetingNotes}
                  placeholder="Add your notes here"
                  placeholderTextColor={themeColors.textMuted}
                  multiline={true}
                  cursorColor={isDark ? '#93C5FD' : colors.accent}
                  selectionColor={isDark ? 'rgba(147, 197, 253, 0.35)' : 'rgba(45, 79, 60, 0.25)'}
                  textAlignVertical="top"
                  onFocus={enterEditingMode}
                  style={[
                    styles.sheetNotesInput,
                    isEditingNotes && styles.sheetNotesInputExpanded,
                    { color: themeColors.text },
                  ]}
                />
              </Animated.View>

              {/* Start notes Pill Button */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => onStartNotes(meeting)}
                style={[styles.startNotesButton, { backgroundColor: themeColors.buttonBg }]}
              >
                <Text style={[styles.startNotesText, { color: themeColors.buttonText }]}>
                  Start notes
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  sheetHeaderBar: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  collapseEditingBtn: {
    position: 'absolute',
    right: 0,
    top: -2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  collapseEditingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sheetTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 38,
    marginBottom: 16,
    letterSpacing: -0.4,
  },
  sheetTitleEditing: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 8,
  },
  sheetChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  sheetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  sheetChipDate: {
    fontFamily: fontFamilies.serif,
    fontSize: 12.5,
    fontWeight: '600',
    marginLeft: 6,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  chipAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chipAvatarText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetLocationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  sheetLocationText: {
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 160,
  },
  sheetNotesInput: {
    fontFamily: fontFamilies.sans,
    fontSize: 15,
    minHeight: 44,
    maxHeight: 130,
    textAlignVertical: 'top',
    marginBottom: 10,
    paddingVertical: 8,
  },
  sheetNotesInputExpanded: {
    minHeight: 85,
    maxHeight: 140,
    textAlignVertical: 'top',
    paddingTop: 8,
    fontSize: 15.5,
    lineHeight: 22,
    marginBottom: 12,
  },
  startNotesButton: {
    borderRadius: 999,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 2,
  },
  startNotesText: {
    fontSize: 15,
    fontWeight: '700',
  },
  attendeePopoverCard: {
    borderRadius: 16,
    borderWidth: 1,
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
  },
  popoverTimeText: {
    fontSize: 12,
    marginTop: 2,
  },
  popoverDivider: {
    height: 1,
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
  },
  popoverAttendeeEmail: {
    fontSize: 11,
    marginTop: 1,
  },
});
