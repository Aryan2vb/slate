import React, { useEffect } from 'react';
import {
  BackHandler,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  SlideInRight,
  SlideOutRight,
  FadeIn,
  Easing,
} from 'react-native-reanimated';
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
import NoteCard from '../features/notes/components/NoteCard';
import FoldersModal from '../features/notes/components/FoldersModal';
import { Note } from '../types/notes';
import { useNoteStore } from '../store/useNoteStore';
import { useFolderStore } from '../store/useFolderStore';

interface AgendaScreenProps {
  onOpenDossier?: (meeting: MeetingEvent) => void;
  onStartCopilot?: (meeting: MeetingEvent) => void;
  onOpenProfile?: () => void;
  onOpenNote?: (note: Note) => void;
}

export default function AgendaScreen({
  onOpenDossier,
  onStartCopilot,
  onOpenProfile,
  onOpenNote,
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

  const notes = useNoteStore((s) => s.notes);
  const deleteNote = useNoteStore((s) => s.deleteNote);

  const [foldersModalOpen, setFoldersModalOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const searchInputRef = React.useRef<TextInput>(null);

  const selectedFolderId = useFolderStore((s) => s.selectedFolderId);
  const setSelectedFolderId = useFolderStore((s) => s.setSelectedFolderId);
  const folders = useFolderStore((s) => s.folders);
  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  const displayedNotes = React.useMemo(() => {
    let list = notes;
    if (selectedFolderId) {
      list = list.filter((n) => n.folderId === selectedFolderId);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (n) =>
          (n.title && n.title.toLowerCase().includes(q)) ||
          (n.body && n.body.toLowerCase().includes(q))
      );
    }
    return list;
  }, [notes, selectedFolderId, searchQuery]);

  useEffect(() => {
    void fetchMeetings(false, refreshAccessToken);
  }, [fetchMeetings, refreshAccessToken]);

  // Hardware/gesture Back navigation: steps back through modals rather than closing app
  useEffect(() => {
    const onBackPress = () => {
      if (isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery('');
        return true;
      }
      if (foldersModalOpen) {
        setFoldersModalOpen(false);
        return true;
      }
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
  }, [isSearchOpen, foldersModalOpen, attendeeModalMeeting, selectedMeeting, profileOpen, setAttendeeModalMeeting, setSelectedMeeting, setProfileOpen]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={themeColors.barStyle} backgroundColor={themeColors.bg} />

      {/* Top App Bar */}
      <View style={styles.topBar}>
        {isSearchOpen ? (
          /* Expandable Search Input Bar expanding to the left side with left icon formed */
          <Animated.View
            entering={SlideInRight.duration(240).easing(Easing.bezier(0.22, 1, 0.36, 1))}
            exiting={SlideOutRight.duration(180).easing(Easing.bezier(0.22, 1, 0.36, 1))}
            style={styles.expandedTopSearchBar}
          >

            <View
              style={[
                styles.topSearchInputWrap,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.cardBorder,
                },
              ]}
            >

              
              {/* The left icon formed */}
              <Icon name="search" size={16} color={themeColors.textSecondary} />
              <TextInput
                ref={searchInputRef}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search notes by title or content..."
                placeholderTextColor={themeColors.textMuted}
                style={[styles.topSearchInput, { color: themeColors.text }]}
                autoFocus
                returnKeyType="search"
              />
            </View>

          </Animated.View>
        ) : (
          <>
            {/* Left: Folder circular button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                void Haptics.selectionAsync();
                setFoldersModalOpen(true);
              }}
              style={[
                styles.circleButton,
                {
                  backgroundColor: selectedFolderId
                    ? isDark
                      ? 'rgba(255,255,255,0.12)'
                      : '#EBE9E4'
                    : themeColors.card,
                  borderColor: selectedFolderId ? themeColors.text : themeColors.cardBorder,
                },
              ]}
            >
              <Animated.View entering={FadeIn.duration(200)}>
                <Icon
                  name="folder"
                  size={18}
                  color={selectedFolderId ? themeColors.text : themeColors.textSecondary}
                />
              </Animated.View>
            </TouchableOpacity>

            {/* Right: Search + Profile Photo */}
            <View style={styles.topRightActions}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setIsSearchOpen(true);
                }}
                style={[
                  styles.circleButton,
                  { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
                ]}
              >
                <Icon
                  name="search"
                  size={18}
                  color={themeColors.textSecondary}
                />
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
          </>
        )}
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
        {/* Screen Title & Active Folder Filter */}
        <View style={styles.titleSection}>
          <Text style={[styles.screenTitle, { color: themeColors.text }]}>My notes</Text>
          <View style={styles.titleRightRow}>
            {searchQuery.trim() ? (
              <View style={[styles.searchQueryBadge]}>
                <Text style={[styles.searchQueryBadgeText, { color: themeColors.textSecondary }]}>
                  {displayedNotes.length} {displayedNotes.length === 1 ? 'note' : 'notes'} found
                </Text>
              </View>
            ) : null}

            {selectedFolder && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setSelectedFolderId(null);
                }}
                style={[
                  styles.activeFolderFilterBar,
                  { backgroundColor: themeColors.pillBg, borderColor: themeColors.cardBorder },
                ]}
              >
                <Icon name="folder" size={13} color={themeColors.text} />
                <Text style={[styles.activeFolderName, { color: themeColors.text }]} numberOfLines={1}>
                  {selectedFolder.name}
                </Text>
                <Icon name="x" size={13} color={themeColors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* "Coming up" Section */}
        {upcomingEvents.length > 0 && !searchQuery.trim() && (
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

        {/* Notes Feed: Real Saved Notes or Empty Graphic */}
        {displayedNotes && displayedNotes.length > 0 ? (
          <View style={styles.notesFeedSection}>
            {displayedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                themeColors={themeColors}
                isDark={isDark}
                onPress={(item) => onOpenNote && onOpenNote(item)}
                onDelete={(id) => deleteNote(id)}
              />
            ))}
          </View>
        ) : (
          /* Center Empty State */
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
              {searchQuery.trim()
                ? `No notes match "${searchQuery.trim()}"`
                : selectedFolder
                ? `No notes in "${selectedFolder.name}"`
                : 'No notes yet'}
            </Text>
            {searchQuery.trim() ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearFilterBtn}
              >
                <Text style={[styles.clearFilterText, { color: themeColors.textSecondary }]}>
                  Clear search
                </Text>
              </TouchableOpacity>
            ) : selectedFolder ? (
              <TouchableOpacity
                onPress={() => setSelectedFolderId(null)}
                style={styles.clearFilterBtn}
              >
                <Text style={[styles.clearFilterText, { color: themeColors.textSecondary }]}>
                  View all notes
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
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

      {/* Folders Management Modal */}
      <FoldersModal
        visible={foldersModalOpen}
        themeColors={themeColors}
        isDark={isDark}
        onClose={() => setFoldersModalOpen(false)}
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
  expandedTopSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topSearchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  topSearchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  topSearchCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  topSearchCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  titleSection: {
    marginTop: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  titleRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchQueryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  searchQueryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  screenTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 34,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  activeFolderFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 180,
  },
  activeFolderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  activeFolderName: {
    fontSize: 12,
    fontWeight: '600',
  },
  clearFilterBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearFilterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  comingUpSection: {
    marginBottom: 24,
  },
  notesFeedSection: {
    marginTop: 4,
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
