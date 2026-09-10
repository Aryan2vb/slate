import React, { useEffect } from 'react';
import {
  BackHandler,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MeetingEvent } from '../types/calendar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Icon from '../components/Icon';
import { fontFamilies } from '../theme/tokens';

import { useAgendaEvents } from '../features/agenda/hooks/useAgendaEvents';
import EventCard from '../features/agenda/components/EventCard';
import MeetingBottomSheet from '../features/agenda/components/MeetingBottomSheet';
import AttendeesModal from '../features/agenda/components/AttendeesModal';
import ProfileModal from '../features/agenda/components/ProfileModal';

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
    meetingSignOut,
    showMore,
    setShowMore,
    selectedMeeting,
    setSelectedMeeting,
    attendeeModalMeeting,
    setAttendeeModalMeeting,
    showAttendeeDropdown,
    setShowAttendeeDropdown,
    quickMeetingNotes,
    setQuickMeetingNotes,
    profileOpen,
    setProfileOpen,
    modalAttendees,
    upcomingEvents,
    displayedEvents,
    handleRefresh,
    handleSelectMeeting,
    handleOpenMeeting,
    handleStartNotes,
  } = useAgendaEvents({
    authUser,
    refreshAccessToken,
    isDark,
    onStartCopilot,
  });

  useEffect(() => {
    void fetchMeetings(false, refreshAccessToken);
  }, [fetchMeetings, refreshAccessToken]);

  // Hardware/gesture Back navigation: steps back through modals rather than closing app
  useEffect(() => {
    const onBackPress = () => {
      if (attendeeModalMeeting) {
        setAttendeeModalMeeting(null);
        return true;
      }
      if (selectedMeeting) {
        setSelectedMeeting(null);
        return true;
      }
      if (profileOpen) {
        setProfileOpen(false);
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [attendeeModalMeeting, selectedMeeting, profileOpen, setAttendeeModalMeeting, setSelectedMeeting, setProfileOpen]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={themeColors.barStyle} backgroundColor={themeColors.bg} />

      {/* Top App Bar */}
      <View style={styles.topBar}>
        {/* Left: Folder circular button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => void Haptics.selectionAsync()}
          style={[
            styles.circleButton,
            { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
          ]}
        >
          <Icon name="folder" size={18} color={themeColors.textSecondary} />
        </TouchableOpacity>

        {/* Right: Search + Profile Photo */}
        <View style={styles.topRightActions}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => void Haptics.selectionAsync()}
            style={[
              styles.circleButton,
              { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
            ]}
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
        {/* Screen Title */}
        <Text style={[styles.screenTitle, { color: themeColors.text }]}>My notes</Text>

        {/* "Coming up" Section */}
        {upcomingEvents.length > 0 && (
          <View style={styles.comingUpSection}>
            <View style={styles.comingUpHeaderRow}>
              <Text style={[styles.comingUpLabel, { color: themeColors.textMuted }]}>
                Coming up
              </Text>
              <TouchableOpacity
                onPress={() => {
                  void Haptics.selectionAsync();
                  setShowMore((prev) => !prev);
                }}
                activeOpacity={0.7}
                style={styles.showMoreButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.showMoreText, { color: themeColors.textMuted }]}>
                  {showMore && upcomingEvents.length > 1 ? 'Show less' : 'Show more'}
                </Text>
                <Icon
                  name={showMore && upcomingEvents.length > 1 ? 'chevron-up' : 'chevron-expand'}
                  size={14}
                  color={themeColors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Upcoming Meeting Cards */}
            {displayedEvents.map((meeting) => (
              <EventCard
                key={meeting.id}
                meeting={meeting}
                themeColors={themeColors}
                onSelect={handleSelectMeeting}
              />
            ))}
          </View>
        )}

        {/* Center Empty State: Angled Notebook Graphic + "No notes yet" */}
        <View style={styles.emptyCenterContainer}>
          <View style={styles.notebookGraphic}>
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
          <Text style={[styles.noNotesText, { color: themeColors.textMuted }]}>
            No notes yet
          </Text>
        </View>
      </ScrollView>

      {/* Floating Action Button: "✎ New note" */}
      <View
        pointerEvents="box-none"
        style={[styles.floatingBottomBar, { paddingBottom: Math.max(insets.bottom, 24) + 10 }]}
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
          <Icon
            name="edit-2"
            size={17}
            color={themeColors.buttonText}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.newNoteText, { color: themeColors.buttonText }]}>
            New note
          </Text>
        </TouchableOpacity>
      </View>

      {/* Meeting Details Bottom Sheet Modal */}
      <MeetingBottomSheet
        meeting={selectedMeeting}
        showAttendeeDropdown={showAttendeeDropdown}
        setShowAttendeeDropdown={setShowAttendeeDropdown}
        quickMeetingNotes={quickMeetingNotes}
        setQuickMeetingNotes={setQuickMeetingNotes}
        authUser={authUser}
        themeColors={themeColors}
        isDark={isDark}
        insetsBottom={insets.bottom}
        onOpenAttendeeModal={(meeting) => setAttendeeModalMeeting(meeting)}
        onOpenMeetingUrl={handleOpenMeeting}
        onStartNotes={handleStartNotes}
        onClose={() => setSelectedMeeting(null)}
      />

      {/* Account Profile Sheet */}
      <ProfileModal
        visible={profileOpen}
        authUser={authUser}
        onSync={() => {
          handleRefresh();
          setProfileOpen(false);
        }}
        onSignOut={async () => {
          setProfileOpen(false);
          await meetingSignOut();
          await authSignOut();
        }}
        onClose={() => setProfileOpen(false)}
      />

      {/* Scrollable Attendees Pop-Up Modal */}
      <AttendeesModal
        meeting={attendeeModalMeeting}
        attendees={modalAttendees}
        authUser={authUser}
        themeColors={themeColors}
        isDark={isDark}
        onClose={() => setAttendeeModalMeeting(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    borderWidth: 1,
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
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 16,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  screenTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 34,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 24,
    letterSpacing: -0.4,
  },
  comingUpSection: {
    marginBottom: 24,
  },
  comingUpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  comingUpLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyCenterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    marginBottom: 60,
  },
  notebookGraphic: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  notebookSheetBack: {
    position: 'absolute',
    width: 52,
    height: 64,
    borderRadius: 8,
    borderWidth: 1.5,
    transform: [{ rotate: '-8deg' }],
  },
  notebookSheetFront: {
    position: 'absolute',
    width: 52,
    height: 64,
    borderRadius: 8,
    borderWidth: 1.5,
    transform: [{ rotate: '4deg' }],
  },
  noNotesText: {
    fontSize: 14,
    fontWeight: '500',
  },
  floatingBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
  },
  newNoteButton: {
    width: '100%',
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  newNoteText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
