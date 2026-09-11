import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { Note } from '../../../types/notes';
import Icon from '../../../components/Icon';
import { fontFamilies } from '../../../theme/tokens';
import { formatElapsed } from '../../../data/meetings';
import DeleteConfirmModal from '../../../components/DeleteConfirmModal';

interface NoteCardProps {
  note: Note;
  themeColors: any;
  isDark: boolean;
  onPress: (note: Note) => void;
  onDelete: (id: string) => void;
}

function formatNoteDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const time = date
    .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();

  if (isToday) {
    return `Today, ${time}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `Yesterday, ${time}`;
  }

  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${monthDay}, ${time}`;
}

export default function NoteCard({
  note,
  themeColors,
  isDark,
  onPress,
  onDelete,
}: NoteCardProps) {
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const isDraft =
    note.isDraft ||
    !note.title ||
    note.title.trim() === 'Untitled note' ||
    note.title.trim() === 'Draft';

  const displayTitle = isDraft ? 'Draft' : note.title;

  const handleDeletePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeleteModalVisible(true);
  };

  const previewSnippet = note.body?.trim()
    ? note.body.trim().replace(/\n+/g, ' ')
    : 'No additional notes';

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onPress(note)}
        onLongPress={handleDeletePress}
        style={[
          styles.card,
          {
            backgroundColor: themeColors.card,
            borderColor: themeColors.cardBorder,
          },
        ]}
      >
        {/* Top row: Date & Status Badges */}
        <View style={styles.topRow}>
          <Text style={[styles.dateText, { color: themeColors.textMuted }]}>
            {formatNoteDate(note.updatedAt || note.createdAt)}
          </Text>

          <View style={styles.topBadgesRow}>
            {/* Audio recording badge: ONLY displayed if user actually recorded audio */}
            {note.elapsedSeconds && note.elapsedSeconds > 0 ? (
              <View style={[styles.timerBadge, { backgroundColor: themeColors.pillBg }]}>
                <View style={styles.recordingDot} />
                <Text style={[styles.timerText, { color: themeColors.textMuted }]}>
                  {formatElapsed(note.elapsedSeconds)}
                </Text>
              </View>
            ) : null}

            {/* Delete note icon button */}
            <TouchableOpacity
              activeOpacity={0.65}
              onPress={handleDeletePress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.deleteCardBtn}
            >
              <Icon name="trash" size={13} color={themeColors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Note Title */}
        <Text
          style={[
            styles.title,
            { color: isDraft ? themeColors.textSecondary : themeColors.text },
            isDraft && styles.draftTitleStyle,
          ]}
          numberOfLines={1}
        >
          {displayTitle}
        </Text>

        {/* 2-line snippet preview */}
        <Text
          style={[styles.snippet, { color: themeColors.textSecondary }]}
          numberOfLines={2}
        >
          {previewSnippet}
        </Text>
      </TouchableOpacity>

      <DeleteConfirmModal
        visible={deleteModalVisible}
        title="Delete Note"
        message={`Are you sure you want to delete "${displayTitle}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          setDeleteModalVisible(false);
          onDelete(note.id);
        }}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  draftBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  draftText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 5,
  },
  recordingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  timerText: {
    fontFamily: fontFamilies.mono,
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    fontFamily: fontFamilies.serif,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  draftTitleStyle: {
    fontStyle: 'italic',
  },
  snippet: {
    fontFamily: fontFamilies.serif,
    fontSize: 13,
    lineHeight: 19,
  },
  deleteCardBtn: {
    padding: 3,
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: '65%',
  },
  metaTagText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
