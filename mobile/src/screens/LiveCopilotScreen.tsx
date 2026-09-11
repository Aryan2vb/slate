import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  PanResponder,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '../components/Icon';
import { Objective } from '../data/intel';
import { Meeting, formatElapsed } from '../data/meetings';
import { useTheme } from '../context/ThemeContext';
import { fontFamilies } from '../theme/tokens';
import { Folder, Note } from '../types/notes';
import { useNoteStore } from '../store/useNoteStore';
import FolderPickerModal from '../features/notes/components/FolderPickerModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

interface LiveCopilotScreenProps {
  meeting: Meeting;
  objectives: Objective[];
  existingNote?: Note;
  onEnd: () => void;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

export default function LiveCopilotScreen({
  meeting,
  objectives,
  existingNote,
  onEnd,
}: LiveCopilotScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();
  const saveNote = useNoteStore((s) => s.saveNote);
  const deleteNote = useNoteStore((s) => s.deleteNote);

  // If clicked from main page "New note", start with blank title; if clicked "Start note" on an event, use meeting title
  const isAdHocNote = !meeting.title || meeting.title === 'New Note' || meeting.id.startsWith('adhoc-');
  const initialTitle = existingNote ? existingNote.title : (isAdHocNote ? '' : meeting.title);
  const initialBody = existingNote ? existingNote.body : '';
  const initialElapsed = existingNote?.elapsedSeconds || 0;

  const [noteTitle, setNoteTitle] = useState(initialTitle);
  const [noteBody, setNoteBody] = useState(initialBody);
  const [elapsed, setElapsed] = useState(initialElapsed);
  const [isRecording, setIsRecording] = useState(false);
  const [folderId, setFolderId] = useState<string | undefined>(existingNote?.folderId);
  const [folderName, setFolderName] = useState<string | undefined>(existingNote?.folderName);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [wrapUpOpen, setWrapUpOpen] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const bodyInputRef = useRef<TextInput>(null);

  // Recording timer (only runs when explicitly active)
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  const toggleRecording = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording((prev) => !prev);
  };

  const handleOpenWrapUp = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Keyboard.dismiss();
    setIsRecording(false);
    setWrapUpOpen(true);
  };

  const isDraft = useMemo(() => {
    const trimmed = noteTitle.trim();
    return !trimmed || trimmed.toLowerCase() === 'untitled note' || trimmed.toLowerCase() === 'draft';
  }, [noteTitle]);

  // Detected URLs in the note body
  const detectedLinks = useMemo(() => {
    return Array.from(new Set(noteBody.match(URL_REGEX) || []));
  }, [noteBody]);

  const handlePreviewLink = async (url: string) => {
    void Haptics.selectionAsync();
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to open link', `Cannot open: ${url}`);
      }
    } catch (err) {
      console.error('Failed to open URL:', err);
      Alert.alert('Error', 'Could not open link.');
    }
  };

  const handleDeleteNote = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeleteModalVisible(true);
  };

  const handleSwipeBack = () => {
    void Haptics.selectionAsync();
    if (noteTitle.trim() || noteBody.trim() || existingNote) {
      saveNote({
        id: existingNote?.id,
        title: isDraft ? 'Untitled note' : noteTitle.trim(),
        body: noteBody,
        meetingId: meeting.id,
        meetingTitle: meeting.title && !meeting.id.startsWith('adhoc-') ? meeting.title : undefined,
        elapsedSeconds: elapsed,
        folderId,
        folderName,
        isDraft,
        detectedLinks,
      });
    }
    onEnd();
  };

  // Left swipe gesture to smoothly go back to the main page
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > 18 && Math.abs(gestureState.dy) < 14;
        return isHorizontal && (gestureState.dx < -12 || (gestureState.x0 < 45 && gestureState.dx > 15));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -35 || gestureState.vx < -0.3 || (gestureState.x0 < 50 && gestureState.dx > 35)) {
          handleSwipeBack();
        }
      },
    })
  ).current;

  const handleSaveNote = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    saveNote({
      id: existingNote?.id,
      title: isDraft ? 'Untitled note' : noteTitle.trim(),
      body: noteBody,
      meetingId: meeting.id,
      meetingTitle: meeting.title && !meeting.id.startsWith('adhoc-') ? meeting.title : undefined,
      elapsedSeconds: elapsed,
      folderId,
      folderName,
      isDraft,
      detectedLinks,
    });
    onEnd();
  };

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: themeColors.bg }]}
      {...panResponder.panHandlers}
    >
      <StatusBar barStyle={themeColors.barStyle} backgroundColor={themeColors.bg} />

      {/* Clean Top Bar: Close, Recording status pill, Delete note button, Finish */}
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: themeColors.bg,
            borderBottomColor: themeColors.divider,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        {/* Left: Close button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleOpenWrapUp}
          style={[
            styles.circleBtn,
            { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
          ]}
        >
          <Icon name="x" size={17} color={themeColors.textSecondary} />
        </TouchableOpacity>

        {/* Live Recording Status Pill */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={toggleRecording}
          style={[
            styles.statusPill,
            {
              backgroundColor: isRecording
                ? isDark
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(239, 68, 68, 0.1)'
                : elapsed > 0
                ? themeColors.pillBg
                : 'transparent',
              borderColor: isRecording
                ? isDark
                  ? 'rgba(239, 68, 68, 0.4)'
                  : 'rgba(239, 68, 68, 0.3)'
                : themeColors.cardBorder,
            },
          ]}
        >
          {isRecording ? (
            <>
              <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
              <Text
                style={[
                  styles.statusText,
                  { color: isDark ? '#FCA5A5' : '#DC2626' },
                ]}
              >
                Listening · {formatElapsed(elapsed)}
              </Text>
            </>
          ) : elapsed > 0 ? (
            <>
              <View style={[styles.statusDot, { backgroundColor: themeColors.textMuted }]} />
              <Text style={[styles.statusText, { color: themeColors.textMuted }]}>
                Paused · {formatElapsed(elapsed)}
              </Text>
            </>
          ) : (
            <>
              <Icon name="mic" size={13} color={themeColors.textSecondary} />
              <Text style={[styles.statusText, { color: themeColors.textSecondary }]}>
                Record audio
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Right Actions: Delete note option + Finish button */}
        <View style={styles.topRightActions}>
          {(existingNote || noteTitle.trim() || noteBody.trim()) && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleDeleteNote}
              style={[
                styles.deleteHeaderBtn,
                { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="trash" size={15} color={themeColors.textSecondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleOpenWrapUp}
            style={[styles.finishBtn, { backgroundColor: themeColors.buttonBg }]}
          >
            <Text style={[styles.finishBtnText, { color: themeColors.buttonText }]}>
              Finish
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Document Canvas */}
      <ScrollView
        style={styles.feed}
        contentContainerStyle={[
          styles.feedContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date line & Metadata Row: Draft badge + "Add to folder" icon on right side of draft */}
        <View style={styles.metaRow}>
          <Text style={[styles.dateSubtitle, { color: themeColors.textMuted }]}>
            {formattedDate}
          </Text>

          <View style={styles.metaRightSide}>
            {/* Draft Badge */}
            {isDraft && (
              <View style={[styles.draftBadge, { backgroundColor: isDark ? '#3D3425' : '#FEF3C7' }]}>
                <Text style={[styles.draftText, { color: isDark ? '#FBBF24' : '#B45309' }]}>
                  Draft
                </Text>
              </View>
            )}

            {/* "Add to Folder" icon on the right side of the draft */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                void Haptics.selectionAsync();
                setFolderPickerOpen(true);
              }}
              style={[
                styles.folderRightOfDraftBtn,
                {
                  backgroundColor: folderName ? themeColors.pillBg : themeColors.card,
                  borderColor: folderName ? themeColors.text : themeColors.cardBorder,
                },
              ]}
            >
              <Icon
                name="folder"
                size={12}
                color={folderName ? themeColors.text : themeColors.textSecondary}
              />
              <Text
                style={[
                  styles.folderRightOfDraftText,
                  { color: folderName ? themeColors.text : themeColors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {folderName || 'Add to folder'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Editable Title */}
        <TextInput
          value={noteTitle}
          onChangeText={setNoteTitle}
          placeholder="Untitled note"
          placeholderTextColor={themeColors.textMuted}
          style={[styles.noteTitleInput, { color: themeColors.text }]}
          returnKeyType="next"
          onSubmitEditing={() => bodyInputRef.current?.focus()}
        />

        {/* Detected Links: Rendered in Blue with link preview option */}
        {detectedLinks.length > 0 && (
          <View style={styles.linksContainer}>
            {detectedLinks.map((link, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.75}
                onPress={() => handlePreviewLink(link)}
                style={[
                  styles.linkPill,
                  {
                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                    borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)',
                  },
                ]}
              >
                <Icon name="link" size={12} color="#3B82F6" />
                <Text
                  style={[styles.linkPillText, { color: isDark ? '#60A5FA' : '#2563EB' }]}
                  numberOfLines={1}
                >
                  {link}
                </Text>
                <View style={styles.previewTag}>
                  <Icon name="external-link" size={11} color={isDark ? '#93C5FD' : '#3B82F6'} />
                  <Text style={[styles.previewTagText, { color: isDark ? '#93C5FD' : '#3B82F6' }]}>
                    Preview
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Note Body: Directly at the bottom of the title */}
        <TextInput
          ref={bodyInputRef}
          value={noteBody}
          onChangeText={setNoteBody}
          placeholder="Write your note, thoughts, key decisions…"
          placeholderTextColor={themeColors.textMuted}
          multiline={true}
          textAlignVertical="top"
          style={[styles.noteBodyInput, { color: themeColors.text }]}
          scrollEnabled={false}
        />
      </ScrollView>

      {/* Wrap-up Confirmation Modal */}
      {wrapUpOpen && (
        <View style={styles.wrapUpOverlay}>
          <TouchableWithoutFeedback onPress={() => setWrapUpOpen(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>

          <Animated.View
            entering={SlideInDown.duration(220)}
            exiting={SlideOutDown.duration(180)}
            style={[
              styles.wrapUpCard,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.cardBorder,
                paddingBottom: insets.bottom + 24,
              },
            ]}
          >
            {/* Grab handle */}
            <View style={[styles.sheetHandle, { backgroundColor: themeColors.divider }]} />

            <Text style={[styles.wrapUpTitle, { color: themeColors.text }]}>
              Save this note?
            </Text>

            <View style={styles.wrapUpMetaRow}>
              {isDraft && (
                <View style={[styles.draftBadge, { backgroundColor: isDark ? '#3D3425' : '#FEF3C7' }]}>
                  <Text style={[styles.draftText, { color: isDark ? '#FBBF24' : '#B45309' }]}>
                    Draft
                  </Text>
                </View>
              )}
              {elapsed > 0 && (
                <Text style={[styles.wrapUpSubtitle, { color: themeColors.textMuted }]}>
                  {formatElapsed(elapsed)} audio
                </Text>
              )}
            </View>

            {/* Folder Selection Option when Saving */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setFolderPickerOpen(true)}
              style={[
                styles.wrapUpFolderOption,
                {
                  backgroundColor: themeColors.bg,
                  borderColor: folderName ? themeColors.text : themeColors.cardBorder,
                },
              ]}
            >
              <View style={styles.wrapUpFolderLeft}>
                <Icon name="folder" size={16} color={themeColors.text} />
                <View>
                  <Text style={[styles.wrapUpFolderLabel, { color: themeColors.textMuted }]}>
                    Folder
                  </Text>
                  <Text style={[styles.wrapUpFolderText, { color: themeColors.text }]}>
                    {folderName ? folderName : 'None (Tap to add to folder)'}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-expand" size={15} color={themeColors.textMuted} />
            </TouchableOpacity>

            {/* Save Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleSaveNote}
              style={[
                styles.wrapUpSaveBtn,
                {
                  backgroundColor: themeColors.buttonBg,
                  shadowColor: isDark ? '#000000' : '#888888',
                },
              ]}
            >
              <Text style={[styles.wrapUpSaveBtnText, { color: themeColors.buttonText }]}>
                Save to My notes
              </Text>
            </TouchableOpacity>

            {/* Delete Note Option */}
            {(existingNote || noteTitle.trim() || noteBody.trim()) && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setWrapUpOpen(false);
                  handleDeleteNote();
                }}
                style={styles.wrapUpDeleteBtn}
              >
                <Icon name="trash" size={14} color="#EF4444" />
                <Text style={styles.wrapUpDeleteText}>Delete note</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      )}

      {/* Folder Picker Modal */}
      <FolderPickerModal
        visible={folderPickerOpen}
        selectedFolderId={folderId}
        themeColors={themeColors}
        isDark={isDark}
        onSelectFolder={(selected) => {
          setFolderId(selected?.id);
          setFolderName(selected?.name);
        }}
        onClose={() => setFolderPickerOpen(false)}
      />

      {/* Custom Delete Confirmation Dialog */}
      <DeleteConfirmModal
        visible={deleteModalVisible}
        title="Delete Note"
        message={
          noteTitle.trim() && !isDraft
            ? `Are you sure you want to delete "${noteTitle.trim()}"? This action cannot be undone.`
            : 'Are you sure you want to delete this draft? This action cannot be undone.'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          setDeleteModalVisible(false);
          if (existingNote?.id) {
            deleteNote(existingNote.id);
          }
          onEnd();
        }}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  finishBtn: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  metaRightSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  draftBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  draftText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  folderRightOfDraftBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: 130,
  },
  folderRightOfDraftText: {
    fontSize: 11,
    fontWeight: '600',
  },
  noteTitleInput: {
    fontFamily: fontFamilies.serif,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 34,
    letterSpacing: -0.4,
    padding: 0,
    marginBottom: 12,
  },
  linksContainer: {
    marginBottom: 14,
    gap: 6,
  },
  linkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  linkPillText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  previewTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  previewTagText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  noteBodyInput: {
    fontFamily: fontFamilies.serif,
    fontSize: 16,
    lineHeight: 26,
    padding: 0,
    minHeight: 220,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapUpDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  wrapUpDeleteText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamilies.sans,
  },
  wrapUpOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  wrapUpCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingTop: 14,
    paddingHorizontal: 22,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 18,
  },
  wrapUpTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  wrapUpMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  wrapUpSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  wrapUpFolderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
  },
  wrapUpFolderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wrapUpFolderLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  wrapUpFolderText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 1,
  },
  wrapUpSaveBtn: {
    width: '100%',
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  wrapUpSaveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
