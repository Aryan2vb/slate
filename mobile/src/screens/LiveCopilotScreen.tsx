import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
  FadeIn,
  FadeInDown,
  LinearTransition,
  SlideInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Icon from '../components/Icon';
import { Objective } from '../data/intel';
import { Meeting, formatElapsed } from '../data/meetings';
import { useTheme } from '../context/ThemeContext';
import { fontFamilies, layoutSpring } from '../theme/tokens';

interface NoteItem {
  id: string;
  rawNote: string;
  aiEnhanced: string;
  timestamp: number;
  speaker?: string;
  isAiSynthesizing?: boolean;
}

interface LiveCopilotScreenProps {
  meeting: Meeting;
  objectives: Objective[];
  onEnd: () => void;
}

/**
 * Screen 2 — "The Meeting Canvas" (Real-time Note-taking + Invisible AI).
 * Matches official Granola dark-mode mobile aesthetic.
 */
export default function LiveCopilotScreen({ meeting, objectives, onEnd }: LiveCopilotScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();

  const [isRecording, setIsRecording] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [userBullet, setUserBullet] = useState('');
  const [wrapUpOpen, setWrapUpOpen] = useState(false);

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  // Recording timer
  useEffect(() => {
    if (!isRecording) return;
    const id = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(id);
  }, [isRecording]);

  // Auto scroll on new note
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [notes.length]);

  const handleAddNote = () => {
    if (!userBullet.trim()) return;
    void Haptics.selectionAsync();

    const newId = Date.now().toString();
    const capturedText = userBullet.trim();
    setUserBullet('');

    // Instant local jot
    setNotes((prev) => [
      ...prev,
      {
        id: newId,
        rawNote: capturedText,
        aiEnhanced: 'Synthesizing with meeting context…',
        timestamp: elapsed,
        isAiSynthesizing: true,
      },
    ]);

    // Background enhancement
    setTimeout(() => {
      setNotes((prev) =>
        prev.map((item) =>
          item.id === newId
            ? {
                ...item,
                aiEnhanced: generateAiSynthesis(capturedText),
                isAiSynthesizing: false,
              }
            : item,
        ),
      );
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 1200);
  };

  const toggleRecording = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording((prev) => !prev);
  };

  const handleOpenWrapUp = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsRecording(false);
    setWrapUpOpen(true);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: themeColors.bg }]}
    >
      <StatusBar barStyle={themeColors.barStyle} backgroundColor={themeColors.bg} />

      {/* Top Bar */}
      <View style={[styles.topBar, { backgroundColor: themeColors.bg, borderBottomColor: themeColors.divider, paddingTop: insets.top + 8 }]}>
        <View style={styles.topBarRow}>
          {/* Back/Close Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleOpenWrapUp}
            style={[styles.closeBtn, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}
          >
            <Icon name="x" size={18} color={themeColors.textSecondary} />
          </TouchableOpacity>

          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text style={[styles.meetingSubtitle, { color: themeColors.text }]} numberOfLines={1}>
              {meeting.title}
            </Text>
          </View>

          {/* Minimal Controls: Timer Pill + Listening + Finish */}
          <View style={styles.topRightControls}>
            <View style={[styles.timerPill, { backgroundColor: themeColors.pillBg, borderColor: themeColors.pillBorder }]}>
              <View
                style={[
                  styles.audioDot,
                  { backgroundColor: isRecording ? '#EF4444' : '#6B7280' },
                ]}
              />
              <Text style={[styles.timerText, { color: themeColors.textSecondary }]}>{formatElapsed(elapsed)}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={toggleRecording}
              style={[
                styles.micToggle,
                {
                  backgroundColor: isRecording ? (isDark ? '#2D2125' : '#FEE2E2') : themeColors.pillBg,
                  borderColor: isRecording ? (isDark ? '#4F2D36' : '#FECACA') : themeColors.pillBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.micToggleText,
                  { color: isRecording ? '#EF4444' : themeColors.textMuted },
                ]}
              >
                {isRecording ? 'Listening' : 'Muted'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenWrapUp}
              style={[styles.finishBtn, { backgroundColor: themeColors.buttonBg }]}
            >
              <Text style={[styles.finishBtnText, { color: themeColors.buttonText }]}>Finish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Main Content Feed */}
      <ScrollView
        ref={scrollRef}
        style={styles.feed}
        contentContainerStyle={[styles.feedContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Meeting Header */}
        <View style={styles.meetingHeaderBlock}>
          <Text style={[styles.meetingTitle, { color: themeColors.text }]}>{meeting.title}</Text>
          <Text style={[styles.meetingDetails, { color: themeColors.textMuted }]}>
            {meeting.startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            {meeting.people.length > 0 ? ` · ${meeting.people.length} attendees` : ''}
          </Text>
        </View>

        {notes.length === 0 ? (
          <View style={styles.emptyCanvasBlock}>
            <Text style={[styles.emptyCanvasTitle, { color: themeColors.text }]}>Meeting Canvas Ready</Text>
            <Text style={[styles.emptyCanvasDesc, { color: themeColors.textMuted }]}>
              Jot notes, key decisions, or takeaways below during your session. Slate will organize and enhance them into clean meeting notes.
            </Text>
          </View>
        ) : (
          notes.map((item) => (
            <Animated.View
              key={item.id}
              layout={LinearTransition.springify().damping(layoutSpring.damping)}
              entering={FadeInDown.duration(260)}
              style={[styles.noteCard, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}
            >
              {/* Raw user note */}
              <View style={styles.rawNoteRow}>
                <Text style={[styles.rawBulletDot, { color: themeColors.textMuted }]}>•</Text>
                <Text style={[styles.rawNoteText, { color: themeColors.text }]}>{item.rawNote}</Text>
                <Text style={[styles.noteTimestamp, { color: themeColors.textMuted }]}>{formatElapsed(item.timestamp)}</Text>
              </View>

              {/* AI Enhanced note */}
              <View style={[styles.aiEnhanceBlock, { backgroundColor: isDark ? '#1C1D21' : '#F5F4EE', borderColor: themeColors.cardBorder }]}>
                <View style={styles.aiTagRow}>
                  <Text style={styles.aiEnhanceTag}>SLATE ENHANCEMENT</Text>
                  {item.isAiSynthesizing ? (
                    <Text style={styles.aiSynthesizing}>Writing…</Text>
                  ) : null}
                </View>
                <Text style={[styles.aiEnhanceText, { color: themeColors.textSecondary }]}>{item.aiEnhanced}</Text>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Clean Bottom Input Bar */}
      <View style={[styles.bottomInputBar, { backgroundColor: themeColors.bg, borderTopColor: themeColors.divider, paddingBottom: insets.bottom + 8 }]}>
        <View style={[styles.inputWrap, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
          <Text style={[styles.inputBullet, { color: themeColors.textMuted }]}>•</Text>
          <TextInput
            value={userBullet}
            onChangeText={setUserBullet}
            placeholder="Jot a note (AI enhances in real-time)..."
            placeholderTextColor={themeColors.textMuted}
            style={[styles.textInput, { color: themeColors.text }]}
            onSubmitEditing={handleAddNote}
            returnKeyType="done"
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleAddNote}
            disabled={!userBullet.trim()}
            style={[
              styles.addBtn,
              { backgroundColor: userBullet.trim() ? themeColors.buttonBg : themeColors.pillBg },
            ]}
          >
            <Text
              style={[
                styles.addBtnText,
                { color: userBullet.trim() ? themeColors.buttonText : themeColors.textMuted },
              ]}
            >
              Add
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Wrap-up Modal */}
      {wrapUpOpen && (
        <View style={styles.wrapUpOverlay}>
          <Animated.View entering={SlideInDown.duration(240)} style={[styles.wrapUpCard, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
            <View style={[styles.sheetHandle, { backgroundColor: themeColors.divider }]} />
            <Text style={[styles.wrapUpTitle, { color: themeColors.text }]}>Wrap up this session?</Text>
            <Text style={[styles.wrapUpSubtitle, { color: themeColors.textMuted }]}>
              {formatElapsed(elapsed)} recorded · {notes.length} notes captured
            </Text>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={onEnd}
              style={[styles.wrapUpSaveBtn, { backgroundColor: themeColors.buttonBg }]}
            >
              <Text style={[styles.wrapUpSaveText, { color: themeColors.buttonText }]}>Save to My notes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setWrapUpOpen(false);
                setIsRecording(true);
              }}
              style={[styles.wrapUpResumeBtn, { backgroundColor: themeColors.pillBg, borderColor: themeColors.pillBorder }]}
            >
              <Text style={[styles.wrapUpResumeText, { color: themeColors.text }]}>Keep taking notes</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function generateAiSynthesis(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('budget') || lower.includes('cost')) {
    return `Financial Note: "${raw}". Documented for financial plan follow-up.`;
  }
  if (lower.includes('launch') || lower.includes('push') || lower.includes('deadline')) {
    return `Timeline Milestone: "${raw}". Alignment verified across deliverables.`;
  }
  if (lower.includes('hire') || lower.includes('team') || lower.includes('headcount')) {
    return `Team Note: "${raw}". Documented for team resource allocation.`;
  }
  return `Synthesized Note: "${raw}". Documented and assigned to follow-up docket.`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161719', // Granola Dark BG
  },

  // Top Bar
  topBar: {
    backgroundColor: '#161719',
    borderBottomWidth: 1,
    borderBottomColor: '#24262C',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#222328',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2F3138',
  },
  meetingSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222328',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2E3037',
    gap: 6,
  },
  audioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timerText: {
    fontFamily: fontFamilies.mono,
    fontSize: 12,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  micToggle: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  micToggleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  finishBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  finishBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },

  // Content Feed
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  meetingHeaderBlock: {
    marginBottom: 20,
  },
  meetingTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 34,
  },
  meetingDetails: {
    fontSize: 13,
    color: '#8E929B',
    marginTop: 4,
  },

  emptyCanvasBlock: {
    backgroundColor: '#202125',
    borderWidth: 1,
    borderColor: '#2B2D33',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyCanvasTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 19,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptyCanvasDesc: {
    fontSize: 13,
    color: '#8E929B',
    textAlign: 'center',
    lineHeight: 20,
  },

  noteCard: {
    backgroundColor: '#202125',
    borderWidth: 1,
    borderColor: '#2A2C31',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  rawNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  rawBulletDot: {
    fontSize: 14,
    color: '#8E929B',
    lineHeight: 20,
  },
  rawNoteText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#F3F4F6',
    lineHeight: 21,
  },
  noteTimestamp: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    color: '#8E929B',
    marginTop: 2,
  },

  // AI Enhancer block
  aiEnhanceBlock: {
    backgroundColor: '#28292F',
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#34363F',
  },
  aiTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  aiEnhanceTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#9CA3AF',
  },
  aiSynthesizing: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  aiEnhanceText: {
    fontSize: 13,
    color: '#D1D5DB',
    lineHeight: 19,
  },

  // Bottom Input Bar
  bottomInputBar: {
    backgroundColor: '#1B1C1F',
    borderTopWidth: 1,
    borderTopColor: '#28292F',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#24252A',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#34363E',
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  inputBullet: {
    fontSize: 16,
    color: '#9CA3AF',
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    paddingVertical: 8,
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Wrap Up Modal
  wrapUpOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  wrapUpCard: {
    backgroundColor: '#1E1F23',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3C44',
    marginBottom: 16,
  },
  wrapUpTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  wrapUpSubtitle: {
    fontSize: 13,
    color: '#8E929B',
    marginBottom: 24,
  },
  wrapUpSaveBtn: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  wrapUpSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  wrapUpResumeBtn: {
    paddingVertical: 10,
  },
  wrapUpResumeText: {
    fontSize: 14,
    color: '#8E929B',
  },
});
