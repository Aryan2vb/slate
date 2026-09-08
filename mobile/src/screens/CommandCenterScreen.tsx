import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { fetchCalendarEvents } from '../services/api';
import {
  Meeting,
  formatRange,
  toMeeting,
} from '../data/meetings';
import { colors, fontFamilies, layoutSpring, radius, space, type } from '../theme/tokens';
import { Avatar, AvatarStack } from '../components/Avatar';
import GlassSheet from '../components/GlassSheet';
import Icon from '../components/Icon';
import Pill from '../components/Pill';
import PressableScale from '../components/PressableScale';
import useNow from '../hooks/useNow';

interface CommandCenterScreenProps {
  onOpenMeeting: (meeting: Meeting) => void;
}

type SyncState =
  | { status: 'idle' }
  | { status: 'syncing' }
  | { status: 'synced'; at: Date }
  | { status: 'sample'; reason: string };

interface QuickJot {
  id: string;
  text: string;
  done: boolean;
}

/**
 * Screen 1 — "Today’s Desk" (The Notion / Granola Calendar Feed).
 *
 * Calm, editorial, warm typography-driven paper aesthetic.
 * Features an editorial greeting, next meeting card with "Read AI Brief →",
 * and an interactive Notion-style Quick Jots scratchpad.
 */
export default function CommandCenterScreen({ onOpenMeeting }: CommandCenterScreenProps) {
  const { user, token, googleAccessToken, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const now = useNow();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [sync, setSync] = useState<SyncState>({ status: 'idle' });
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  // Quick Jots scratchpad state
  const [jots, setJots] = useState<QuickJot[]>([]);
  const [newJotText, setNewJotText] = useState('');

  const load = useCallback(async () => {
    if (!token || !googleAccessToken) {
      setMeetings([]);
      setSync({ status: 'idle' });
      setLoading(false);
      return;
    }

    setSync({ status: 'syncing' });
    try {
      const events = await fetchCalendarEvents(token, googleAccessToken);
      const mapped = events.map(toMeeting);
      setMeetings(mapped);
      setSync({ status: 'synced', at: new Date() });
    } catch (err: any) {
      if (err?.message === 'SESSION_EXPIRED') {
        void signOut();
        return;
      }
      setMeetings([]);
      setSync({ status: 'idle' });
    } finally {
      setLoading(false);
    }
  }, [token, googleAccessToken, signOut]);

  useEffect(() => {
    void load();
  }, [load]);

  const upcoming = useMemo(
    () =>
      [...meetings]
        .filter((m) => m.endTime.getTime() > now.getTime())
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    [meetings, now],
  );

  const [hero, ...rest] = upcoming.length > 0 ? upcoming : meetings;

  const handleAddJot = () => {
    if (!newJotText.trim()) return;
    void Haptics.selectionAsync();
    setJots((prev) => [
      ...prev,
      { id: Date.now().toString(), text: newJotText.trim(), done: false },
    ]);
    setNewJotText('');
  };

  const handleToggleJot = (id: string) => {
    void Haptics.selectionAsync();
    setJots((prev) =>
      prev.map((jot) => (jot.id === id ? { ...jot, done: !jot.done } : jot)),
    );
  };

  const handleDeleteJot = (id: string) => {
    void Haptics.selectionAsync();
    setJots((prev) => prev.filter((jot) => jot.id !== id));
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={sync.status === 'syncing' && !loading}
            onRefresh={load}
            tintColor={colors.accent}
          />
        }
      >
        <EditorialHeader
          user={user}
          sync={sync}
          now={now}
          onPressProfile={() => setProfileOpen(true)}
        />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.loadingText}>Reading your calendar…</Text>
          </View>
        ) : (
          <>
            {/* NO MEETINGS ZERO STATE */}
            {meetings.length === 0 ? (
              <Animated.View entering={FadeInDown.duration(360)} style={styles.emptyDeskCard}>
                <Text style={styles.emptyDeskTitle}>No Calendar Events Found</Text>
                <Text style={styles.emptyDeskSubtitle}>
                  Your Google Calendar has no meetings scheduled for today. New events will appear here once booked.
                </Text>
              </Animated.View>
            ) : null}

            {/* NEXT UP / HERO CARD */}
            {hero ? (
              <Animated.View entering={FadeInDown.duration(360)}>
                <Text style={styles.sectionLabel}>NEXT MEETING</Text>
                <HeroCard meeting={hero} onPress={() => onOpenMeeting(hero)} />
              </Animated.View>
            ) : null}

            {/* QUICK JOTS / NOTION SCRATCHPAD */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(100)}
              style={styles.jotsContainer}
            >
              <View style={styles.jotsHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.sectionLabel}>QUICK JOTS & SCRATCHPAD</Text>
                  <Text style={styles.jotsBadge}>{jots.length}</Text>
                </View>
                <Text style={styles.jotsHint}>Tap to type before call</Text>
              </View>

              <View style={styles.jotsCard}>
                {/* Existing Jots */}
                {jots.length === 0 ? (
                  <View style={styles.emptyJotsRow}>
                    <Text style={styles.emptyJotsText}>
                      No notes yet. Jot thoughts or questions here before your call.
                    </Text>
                  </View>
                ) : (
                  jots.map((jot) => (
                    <View key={jot.id} style={styles.jotRow}>
                      <TouchableOpacity
                        onPress={() => handleToggleJot(jot.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={[styles.jotCheckbox, jot.done && styles.jotCheckboxDone]}
                      >
                        {jot.done ? <Icon name="check" size={10} color="#FFFFFF" /> : null}
                      </TouchableOpacity>
                      <Text
                        onPress={() => handleToggleJot(jot.id)}
                        style={[styles.jotText, jot.done && styles.jotTextDone]}
                      >
                        {jot.text}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteJot(jot.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.jotDelete}
                      >
                        <Text style={styles.jotDeleteText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}

                {/* Input Bar */}
                <View style={styles.jotInputRow}>
                  <Text style={styles.jotBulletSymbol}>•</Text>
                  <TextInput
                    value={newJotText}
                    onChangeText={setNewJotText}
                    placeholder="Jot a thought, agenda note, or question..."
                    placeholderTextColor="#A2A69E"
                    style={styles.jotInput}
                    onSubmitEditing={handleAddJot}
                    returnKeyType="done"
                  />
                  {newJotText.trim() ? (
                    <TouchableOpacity onPress={handleAddJot} style={styles.jotAddBtn}>
                      <Text style={styles.jotAddBtnText}>Add</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </Animated.View>

            {/* LATER TODAY AGENDA */}
            {rest.length > 0 ? (
              <Animated.View
                entering={FadeInDown.duration(400).delay(180)}
                style={styles.laterSection}
              >
                <Text style={styles.sectionLabel}>LATER TODAY</Text>
                <View style={styles.timeline}>
                  <View style={styles.axis} />
                  {rest.map((meeting, index) => (
                    <TimelineRow
                      key={meeting.id}
                      meeting={meeting}
                      index={index}
                      onPress={() => onOpenMeeting(meeting)}
                    />
                  ))}
                </View>
              </Animated.View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Account Sheet */}
      <GlassSheet
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
        title={user?.name ?? 'Signed in'}
        subtitle={user?.email ?? 'Connected with Google Calendar'}
      >
        <View style={styles.sheetInfo}>
          <Text style={styles.sheetInfoText}>
            Slate is synced with your Google Calendar to draft briefs and polish your real-time notes.
          </Text>
        </View>
        <PressableScale
          style={styles.signOut}
          haptic="primary"
          onPress={() => {
            setProfileOpen(false);
            void signOut();
          }}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </PressableScale>
      </GlassSheet>
    </View>
  );
}

/* ------------------------------------------------------------------ */

function EditorialHeader({
  user,
  sync,
  now,
  onPressProfile,
}: {
  user: { name?: string; picture?: string } | null;
  sync: SyncState;
  now: Date;
  onPressProfile: () => void;
}) {
  const dateFormatted = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const syncLabel = sync.status === 'syncing' ? 'Syncing calendar…' : 'Synced with Google';

  return (
    <View style={styles.header}>
      <View style={styles.topStatusRow}>
        <View style={styles.syncPill}>
          <View style={styles.syncDot} />
          <Text style={styles.syncText}>{syncLabel}</Text>
        </View>

        <PressableScale
          haptic="select"
          onPress={onPressProfile}
          style={styles.profile}
          accessibilityLabel="Account"
        >
          <Avatar
            person={{ id: 'me', name: user?.name ?? 'User', avatarUrl: user?.picture }}
            size={36}
            showBrand={false}
            ringColor={colors.border}
          />
        </PressableScale>
      </View>

      <Text style={styles.dateSubtitle}>{dateFormatted}</Text>
      <Text style={styles.greetingTitle}>Today’s Desk</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */

function HeroCard({
  meeting,
  onPress,
}: {
  meeting: Meeting;
  onPress: () => void;
}) {
  const durationMins = Math.max(
    1,
    Math.round((meeting.endTime.getTime() - meeting.startTime.getTime()) / 60_000),
  );

  const attendeeNames = meeting.people.slice(0, 2).map((p) => p.name.split(' ')[0]).join(' & ');
  const metadataText = `${meeting.startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · ${durationMins}m${attendeeNames ? ` · With ${attendeeNames}` : ''}`;

  return (
    <PressableScale onPress={onPress} haptic="select" accessibilityRole="button">
      <View style={styles.heroCard}>
        {/* Top metadata row */}
        <View style={styles.heroMetaRow}>
          <Text style={styles.heroMetaText}>{metadataText}</Text>
          <Pill label={formatRange(meeting)} tone="neutral" />
        </View>

        {/* Large serif title */}
        <Text style={styles.heroTitle}>{meeting.title}</Text>
        {meeting.org ? <Text style={styles.heroOrg}>{meeting.org}</Text> : null}

        {/* Attendee Stack & Location */}
        <View style={styles.heroPeopleRow}>
          <AvatarStack people={meeting.people} size={30} ringColor="#FFFFFF" />
          {meeting.location ? (
            <Text style={styles.heroLocation}>{meeting.location}</Text>
          ) : null}
        </View>

        <View style={styles.heroDivider} />

        {/* Understated Action Link: Read AI Brief -> */}
        <View style={styles.heroActionRow}>
          <View style={styles.heroActionLink}>
            <Text style={styles.heroActionText}>Read AI Brief</Text>
            <Text style={styles.heroActionArrow}>→</Text>
          </View>
          <Pill label="Pre-Meeting Brief Ready" tone="accent" />
        </View>
      </View>
    </PressableScale>
  );
}

/* ------------------------------------------------------------------ */

function TimelineRow({
  meeting,
  index,
  onPress,
}: {
  meeting: Meeting;
  index: number;
  onPress: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(320).delay(40 * index)}
      layout={LinearTransition.springify().damping(layoutSpring.damping)}
      style={styles.timelineRow}
    >
      <View style={styles.timelineGutter}>
        <Text style={styles.timelineTime}>
          {meeting.startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </Text>
        <View style={styles.node} />
      </View>

      <PressableScale onPress={onPress} haptic="select" style={styles.eventCardWrap}>
        <View style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {meeting.title}
            </Text>
            <Text style={styles.eventArrow}>→</Text>
          </View>
          {meeting.org ? <Text style={styles.eventOrg}>{meeting.org}</Text> : null}

          <View style={styles.eventFooter}>
            <View style={styles.tagRow}>
              {meeting.tags.map((tag) => (
                <Pill key={tag} label={tag} caps tone="neutral" />
              ))}
            </View>
            <AvatarStack people={meeting.people} size={24} max={3} ringColor={colors.surface1} />
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */

const GUTTER = 64;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: space.xl,
  },

  header: {
    marginBottom: space.xxl,
  },
  topStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentTint,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    gap: 6,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  syncText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accent,
  },
  profile: {
    width: 36,
    height: 36,
  },

  dateSubtitle: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.accent,
    fontWeight: '700',
    marginBottom: 2,
  },
  greetingTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: space.sm,
  },

  emptyDeskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    alignItems: 'center',
    marginBottom: space.xxl,
  },
  emptyDeskTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  emptyDeskSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    marginBottom: space.xxl,
    shadowColor: '#1F2421',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  heroMetaText: {
    fontFamily: fontFamilies.mono,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  heroTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 30,
    marginBottom: space.xs,
  },
  heroOrg: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: space.lg,
  },
  heroPeopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginBottom: space.md,
  },
  heroLocation: {
    fontSize: 12,
    color: colors.textMuted,
  },
  heroDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: space.md,
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroActionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroActionText: {
    fontFamily: fontFamilies.serif,
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
  heroActionArrow: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
  },

  // Quick Jots Section
  jotsContainer: {
    marginBottom: space.xxl,
  },
  jotsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  jotsBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
    backgroundColor: colors.accentTint,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
  },
  jotsHint: {
    fontSize: 11,
    color: colors.textMuted,
  },
  jotsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  jotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F7F6F2',
    gap: 10,
  },
  jotCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#DCDAD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jotCheckboxDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  jotText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  jotTextDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  jotDelete: {
    paddingHorizontal: 6,
  },
  jotDeleteText: {
    fontSize: 18,
    color: colors.textSubtle,
    fontWeight: '300',
  },
  emptyJotsRow: {
    paddingVertical: space.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyJotsText: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  jotInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 2,
    gap: 8,
  },
  jotBulletSymbol: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '700',
  },
  jotInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    paddingVertical: 6,
  },
  jotAddBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  jotAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Later Section
  laterSection: {
    marginTop: space.xs,
  },
  timeline: {
    position: 'relative',
    marginTop: space.sm,
  },
  axis: {
    position: 'absolute',
    left: GUTTER - 1,
    top: 8,
    bottom: 8,
    width: 1,
    backgroundColor: colors.border,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: space.md,
  },
  timelineGutter: {
    width: GUTTER,
    paddingRight: space.md,
    alignItems: 'flex-end',
    paddingTop: space.md,
  },
  timelineTime: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  node: {
    position: 'absolute',
    right: -4,
    top: space.md + 3,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#DCDAD2',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  eventCardWrap: {
    flex: 1,
    marginLeft: space.md,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  eventArrow: {
    fontSize: 14,
    color: colors.textSubtle,
    marginLeft: 6,
  },
  eventOrg: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.md,
    gap: space.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flexShrink: 1,
  },

  loading: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: space.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
  },

  sheetInfo: {
    backgroundColor: colors.surface2,
    padding: space.md,
    borderRadius: radius.md,
    marginBottom: space.lg,
  },
  sheetInfoText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  signOut: {
    backgroundColor: '#FDE8E8',
    borderWidth: 1,
    borderColor: '#F8B4B4',
    borderRadius: radius.pill,
    paddingVertical: space.md,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.live,
  },
});
