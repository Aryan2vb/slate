import React from 'react';
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { MeetingAttendee, MeetingEvent } from '../../../types/calendar';
import Icon from '../../../components/Icon';

export const AVATAR_COLORS = ['#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'];

interface AttendeesModalProps {
  meeting: MeetingEvent | null;
  attendees: MeetingAttendee[];
  authUser: { email?: string; name?: string; picture?: string } | null;
  themeColors: any;
  isDark: boolean;
  onClose: () => void;
}

export default function AttendeesModal({
  meeting,
  attendees,
  authUser,
  themeColors,
  isDark,
  onClose,
}: AttendeesModalProps) {
  if (!meeting) return null;

  return (
    <Modal
      visible={!!meeting}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.attendeeModalOverlay}>
        {/* Backdrop dismiss touchable */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.attendeeModalContent,
            {
              backgroundColor: isDark ? '#1C1D21' : '#FFFFFF',
              borderColor: themeColors.cardBorder,
            },
          ]}
        >

          {/* Divider */}
          <View
          />

          {/* Scrollable Attendees List */}
          <ScrollView
            style={styles.attendeeModalScroll}
            contentContainerStyle={styles.attendeeModalScrollContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            bounces={true}
          >
            {attendees && attendees.length > 0 ? (
              attendees.map((attendee, idx) => {
                const isMe =
                  (attendee.email &&
                    authUser?.email &&
                    attendee.email.toLowerCase() === authUser.email.toLowerCase()) ||
                  attendee.isSelf;
                const hasAuthPicture = isMe && !!authUser?.picture;
                const displayName =
                  isMe && authUser?.name
                    ? authUser.name
                    : attendee.name && attendee.name.trim().length > 0
                    ? attendee.name.trim()
                    : attendee.email;
                const initial =
                  displayName && displayName.trim().length > 0
                    ? displayName.trim()[0].toUpperCase()
                    : 'A';

                return (
                  <View key={attendee.id || idx} style={styles.attendeeItemRow}>
                    {/* Profile Picture Avatar or Initials */}
                    {hasAuthPicture ? (
                      <Image
                        source={{ uri: authUser!.picture! }}
                        style={styles.attendeeItemAvatar}
                      />
                    ) : (
                      <View
                        style={[
                          styles.attendeeItemAvatar,
                          {
                            backgroundColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                          },
                        ]}
                      >
                        <Text style={styles.attendeeItemAvatarText}>{initial}</Text>
                      </View>
                    )}

                    {/* Name, Email, Organizer Tag */}
                    <View style={styles.attendeeItemDetails}>
                      <View style={styles.attendeeItemNameRow}>
                        <Text
                          style={[styles.attendeeItemName, { color: themeColors.text }]}
                          numberOfLines={1}
                        >
                          {displayName}
                        </Text>
                        {attendee.isOrganizer && (
                          <View
                            style={[
                              styles.organizerBadge,
                              { backgroundColor: 'rgba(59,130,246,0.15)' },
                            ]}
                          >
                            <Text style={styles.organizerBadgeText}>Organizer</Text>
                          </View>
                        )}
                        {isMe && !attendee.isOrganizer && (
                          <View
                            style={[
                              styles.meBadge,
                              { backgroundColor: 'rgba(16,185,129,0.15)' },
                            ]}
                          >
                            <Text style={styles.meBadgeText}>You</Text>
                          </View>
                        )}
                      </View>
                      {attendee.email ? (
                        <Text
                          style={[styles.attendeeItemEmail, { color: themeColors.textMuted }]}
                          numberOfLines={1}
                        >
                          {attendee.email}
                        </Text>
                      ) : null}
                    </View>

                    {/* RSVP Status Icon */}
                    {attendee.responseStatus === 'accepted' ? (
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusAcceptedText}>✓</Text>
                      </View>
                    ) : attendee.responseStatus === 'declined' ? (
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusDeclinedText}>✕</Text>
                      </View>
                    ) : (
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusTentativeText}>?</Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.attendeeItemRow}>
                {authUser?.picture ? (
                  <Image source={{ uri: authUser.picture }} style={styles.attendeeItemAvatar} />
                ) : (
                  <View style={[styles.attendeeItemAvatar, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.attendeeItemAvatarText}>
                      {(authUser?.name || 'Me')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.attendeeItemDetails}>
                  <Text style={[styles.attendeeItemName, { color: themeColors.text }]}>
                    {authUser?.name || 'Me'}
                  </Text>
                  <Text style={[styles.attendeeItemEmail, { color: themeColors.textMuted }]}>
                    {authUser?.email || 'Connected account'}
                  </Text>
                </View>
                <View
                  style={[styles.organizerBadge, { backgroundColor: 'rgba(59,130,246,0.15)' }]}
                >
                  <Text style={styles.organizerBadgeText}>Organizer</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  attendeeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  attendeeModalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  attendeeModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  attendeeModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attendeeModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  attendeeModalScroll: {
    maxHeight: 300,
  },
  attendeeModalScrollContent: {
    gap: 12,
    paddingVertical: 0,
  },
  attendeeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attendeeItemAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  attendeeItemAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  attendeeItemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  attendeeItemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attendeeItemName: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  attendeeItemEmail: {
    fontSize: 12,
    marginTop: 1,
  },
  organizerBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  organizerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#60A5FA',
  },
  meBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  meBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#34D399',
  },
  statusBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusAcceptedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  statusDeclinedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  statusTentativeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
});
