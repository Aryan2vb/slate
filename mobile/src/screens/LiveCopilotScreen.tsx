import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
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

interface LiveCopilotScreenProps {
  meeting: Meeting;
  objectives: Objective[];
  onEnd: () => void;
}

export default function LiveCopilotScreen({ meeting, objectives, onEnd }: LiveCopilotScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();

  // If clicked from main page "New note", start with blank title; if clicked "Start note" on an event, use meeting title
  const isAdHocNote = !meeting.title || meeting.title === 'New Note' || meeting.id.startsWith('adhoc-');
  const [noteTitle, setNoteTitle] = useState(isAdHocNote ? '' : meeting.title);
  const [noteBody, setNoteBody] = useState('');

  const [isRecording, setIsRecording] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [wrapUpOpen, setWrapUpOpen] = useState(false);

  const bodyInputRef = useRef<TextInput>(null);

  // Recording timer
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

  const formattedDate = React.useMemo(() => {
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
    >
      <StatusBar barStyle={themeColors.barStyle} backgroundColor={themeColors.bg} />

      {/* Top Bar: Close, Recording status, Finish */}
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

        {/* Center: Live Recording Status Pill */}
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
                : themeColors.pillBg,
              borderColor: isRecording
                ? isDark
                  ? 'rgba(239, 68, 68, 0.4)'
                  : 'rgba(239, 68, 68, 0.3)'
                : themeColors.pillBorder,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isRecording ? '#EF4444' : themeColors.textMuted },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              {
                color: isRecording
                  ? isDark
                    ? '#FCA5A5'
                    : '#DC2626'
                  : themeColors.textMuted,
              },
            ]}
          >
            {isRecording ? `Listening · ${formatElapsed(elapsed)}` : 'Paused'}
          </Text>
        </TouchableOpacity>

        {/* Right: Finish Button */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleOpenWrapUp}
          style={[styles.finishBtn, { backgroundColor: themeColors.buttonBg }]}
        >
          <Text style={[styles.finishBtnText, { color: themeColors.buttonText }]}>Finish</Text>
        </TouchableOpacity>
      </View>

      {/* Main Document Canvas: Date -> Title -> Direct Writing Body */}
      <ScrollView
        style={styles.feed}
        contentContainerStyle={[
          styles.feedContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date line */}
        <Text style={[styles.dateSubtitle, { color: themeColors.textMuted }]}>
          {formattedDate}
        </Text>

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

        {/* Note Body: Directly at the bottom of the title, full document style */}
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
            <Text style={[styles.wrapUpSubtitle, { color: themeColors.textMuted }]}>
              {formatElapsed(elapsed)} recorded · {noteTitle.trim() || 'Untitled note'}
            </Text>

            {/* Save Button Only (No Keep Taking Notes) */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={onEnd}
              style={[styles.wrapUpSaveBtn, { backgroundColor: themeColors.buttonBg }]}
            >
              <Text style={[styles.wrapUpSaveText, { color: themeColors.buttonText }]}>
                Save to My notes
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Top Bar
  topBar: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    gap: 7,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    fontWeight: '600',
  },
  finishBtn: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  finishBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Content Canvas
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 22,
    paddingTop: 20,
  },

  dateSubtitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  noteTitleInput: {
    fontFamily: fontFamilies.serif,
    fontSize: 30,
    fontWeight: '600',
    letterSpacing: -0.4,
    padding: 0,
    marginBottom: 16,
  },
  noteBodyInput: {
    fontFamily: fontFamilies.sans,
    fontSize: 16,
    lineHeight: 25,
    minHeight: 350,
    padding: 0,
  },

  // Wrap Up Modal
  wrapUpOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  wrapUpCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 14,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 20,
  },
  wrapUpTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  wrapUpSubtitle: {
    fontSize: 13,
    marginBottom: 24,
  },
  wrapUpSaveBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapUpSaveText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
