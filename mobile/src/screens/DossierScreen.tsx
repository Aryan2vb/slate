/**
 * Meeting Dossier & Brief Screen
 * Exact Granola dark-mode aesthetic.
 * All pills (e.g. "Google Calendar", "Google Synced") removed.
 */

import React, { useState } from 'react';
import {
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Person } from '../components/Avatar';
import Icon from '../components/Icon';
import { Objective } from '../data/intel';
import { Meeting, formatRange } from '../data/meetings';
import { useTheme } from '../context/ThemeContext';
import { fontFamilies } from '../theme/tokens';

interface DossierScreenProps {
  meeting: Meeting;
  onBack: () => void;
  onStart: (flagged: Objective[]) => void;
}

interface ActionItem {
  id: string;
  task: string;
  completed: boolean;
}

export default function DossierScreen({ meeting, onBack, onStart }: DossierScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();

  const [actions, setActions] = useState<ActionItem[]>([]);
  const [newActionText, setNewActionText] = useState('');

  const toggleAction = (id: string) => {
    void Haptics.selectionAsync();
    setActions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)),
    );
  };

  const handleAddAction = () => {
    const trimmed = newActionText.trim();
    if (!trimmed) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActions((prev) => [
      ...prev,
      {
        id: `action-${Date.now()}`,
        task: trimmed,
        completed: false,
      },
    ]);
    setNewActionText('');
  };

  const handleDeleteAction = (id: string) => {
    void Haptics.selectionAsync();
    setActions((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={themeColors.barStyle} backgroundColor={themeColors.bg} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={[styles.backBtn, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}
          >
            <Icon name="arrow-left" size={18} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Page Title & Metadata (Serif) */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: themeColors.text }]}>{meeting.title}</Text>
          <Text style={[styles.pageMeta, { color: themeColors.textMuted }]}>
            {formatRange(meeting)} {meeting.org ? `· ${meeting.org}` : ''}
          </Text>
        </Animated.View>

        {/* SECTION 1: CALENDAR DETAILS */}
        <Animated.View entering={FadeInDown.duration(300).delay(60)} style={styles.sectionBlock}>
          <Text style={[styles.sectionHeading, { color: themeColors.text }]}>Details</Text>

          {/* Description box */}
          <View style={[styles.calloutBox, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
            <Text style={[styles.calloutBody, { color: themeColors.textSecondary }]}>
              {meeting.description && meeting.description.trim().length > 0
                ? meeting.description
                : 'No description provided in this calendar invite.'}
            </Text>
          </View>

          {/* Location & Conference link */}
          {meeting.location ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                if (meeting.location && meeting.location.startsWith('http')) {
                  void Linking.openURL(meeting.location);
                }
              }}
              style={styles.locationRow}
            >
              <Icon
                name={meeting.location.includes('http') ? 'video' : 'map-pin'}
                size={14}
                color={themeColors.textMuted}
              />
              <Text
                style={[
                  styles.locationText,
                  { color: themeColors.textSecondary },
                  meeting.location.includes('http') && styles.linkText,
                ]}
                numberOfLines={1}
              >
                {meeting.location}
              </Text>
            </TouchableOpacity>
          ) : null}
        </Animated.View>

        {/* SECTION 2: ATTENDEES ROSTER */}
        <Animated.View entering={FadeInDown.duration(300).delay(120)} style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: themeColors.text }]}>Attendees</Text>
            <Text style={[styles.sectionCount, { color: themeColors.textMuted }]}>{meeting.people.length} people</Text>
          </View>

          {meeting.people.length > 0 ? (
            <View style={styles.rosterList}>
              {meeting.people.map((person) => (
                <View key={person.id} style={[styles.rosterCard, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
                  <Avatar person={person} size={36} ringColor={themeColors.card} />
                  <View style={styles.rosterInfo}>
                    <Text style={[styles.rosterName, { color: themeColors.text }]} numberOfLines={1}>
                      {person.name}
                    </Text>
                    {person.company || person.title ? (
                      <Text style={[styles.rosterRole, { color: themeColors.textMuted }]} numberOfLines={1}>
                        {[person.title, person.company].filter(Boolean).join(' · ')}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyNotice, { color: themeColors.textMuted }]}>No attendees listed on this invite.</Text>
          )}
        </Animated.View>

        {/* SECTION 3: ACTION ITEMS & NOTES */}
        <Animated.View entering={FadeInDown.duration(300).delay(180)} style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: themeColors.text }]}>Action Items & Notes</Text>
            {actions.length > 0 && (
              <Text style={[styles.sectionCount, { color: themeColors.textMuted }]}>
                {actions.filter((a) => a.completed).length}/{actions.length} completed
              </Text>
            )}
          </View>

          <View style={[styles.checklistCard, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
            {actions.length === 0 ? (
              <View style={styles.emptyActionPrompt}>
                <Text style={[styles.emptyActionText, { color: themeColors.textMuted }]}>
                  No action items yet. Use the input below to capture tasks for this meeting.
                </Text>
              </View>
            ) : (
              actions.map((item) => (
                <View key={item.id} style={styles.checkRow}>
                  <TouchableOpacity
                    onPress={() => toggleAction(item.id)}
                    style={[
                      styles.checkbox,
                      { borderColor: themeColors.cardBorder, backgroundColor: themeColors.pillBg },
                      item.completed && styles.checkboxChecked,
                    ]}
                  >
                    {item.completed ? <Icon name="check" size={11} color="#000000" /> : null}
                  </TouchableOpacity>
                  <Text
                    onPress={() => toggleAction(item.id)}
                    style={[
                      styles.checkText,
                      { color: themeColors.text },
                      item.completed && styles.checkTextChecked,
                    ]}
                  >
                    {item.task}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteAction(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.deleteBtn}
                  >
                    <Text style={[styles.deleteBtnText, { color: themeColors.textMuted }]}>×</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Input Bar */}
            <View style={[styles.actionInputRow, { backgroundColor: themeColors.pillBg, borderColor: themeColors.pillBorder }]}>
              <TextInput
                style={[styles.actionInput, { color: themeColors.text }]}
                placeholder="Type an action item…"
                placeholderTextColor={themeColors.textMuted}
                value={newActionText}
                onChangeText={setNewActionText}
                onSubmitEditing={handleAddAction}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={handleAddAction}
                disabled={!newActionText.trim()}
                style={[
                  styles.addBtn,
                  !newActionText.trim() && { opacity: 0.4 },
                ]}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Floating Bottom Bar: "Start notes" Pill */}
      <View
        pointerEvents="box-none"
        style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          style={[styles.startBtn, { backgroundColor: themeColors.buttonBg }]}
          onPress={() => onStart([])}
        >
          <Text style={[styles.startBtnText, { color: themeColors.buttonText }]}>Start notes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161719', // Granola Dark BG
  },
  scroll: {
    paddingHorizontal: 20,
  },

  // Nav
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#202125',
    borderWidth: 1,
    borderColor: '#2D2E34',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Page Header
  pageHeader: {
    marginBottom: 24,
  },
  pageTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 27,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 35,
    marginBottom: 6,
  },
  pageMeta: {
    fontSize: 13,
    color: '#8E929B',
  },

  // Sections
  sectionBlock: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  sectionCount: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Details callout
  calloutBox: {
    backgroundColor: '#202125',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2C31',
    padding: 14,
  },
  calloutBody: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },

  // Location Row
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202125',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2C31',
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#9CA3AF',
    flex: 1,
  },
  linkText: {
    color: '#60A5FA',
  },

  // Roster
  rosterList: {
    gap: 8,
  },
  rosterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202125',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2C31',
    padding: 12,
    gap: 12,
  },
  rosterInfo: {
    flex: 1,
  },
  rosterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rosterRole: {
    fontSize: 12,
    color: '#8E929B',
    marginTop: 1,
  },
  emptyNotice: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },

  // Checklist
  checklistCard: {
    backgroundColor: '#202125',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2C31',
    padding: 14,
  },
  emptyActionPrompt: {
    paddingVertical: 12,
  },
  emptyActionText: {
    fontSize: 13,
    color: '#8E929B',
    lineHeight: 18,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#28292E',
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#4B5563',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  checkText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 19,
  },
  checkTextChecked: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  deleteBtn: {
    paddingHorizontal: 6,
  },
  deleteBtnText: {
    fontSize: 18,
    color: '#6B7280',
  },
  actionInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  actionInput: {
    flex: 1,
    backgroundColor: '#28292E',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#FFFFFF',
  },
  addBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },

  // Bottom Floating Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  startBtn: {
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});
