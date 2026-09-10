import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { MeetingEvent } from '../../../types/calendar';
import Icon from '../../../components/Icon';
import { fontFamilies } from '../../../theme/tokens';
import {
  formatAttendeeCount,
  formatDayAndTime,
  getDayNumber,
  getMonthTitle,
} from '../utils/dateUtils';

interface EventCardProps {
  meeting: MeetingEvent;
  themeColors: any;
  onSelect: (meeting: MeetingEvent) => void;
}

// Warm carrot reddish color tone
const CARROT_RED = '#E5533D';

export default function EventCard({
  meeting,
  themeColors,
  onSelect,
}: EventCardProps) {
  const dayNumber = getDayNumber(meeting.startDate);
  const monthName = getMonthTitle(meeting.startDate);

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onSelect(meeting)}
      style={[
        styles.meetingCard,
        { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder },
      ]}
    >
      {/* Date Box: normal background & border, only the date number (e.g. 11) is carrot red */}
      <View
        style={[
          styles.dateBox,
          {
            backgroundColor: themeColors.dateBoxBg,
            borderColor: themeColors.cardBorder,
          },
        ]}
      >
        <Text style={[styles.dateDayText, { color: CARROT_RED }]}>
          {dayNumber}
        </Text>
        <Text style={[styles.dateMonthText, { color: themeColors.textMuted }]}>
          {monthName}
        </Text>
      </View>

      {/* Meeting Title, Meta & Location */}
      <View style={styles.meetingInfo}>
        <Text
          style={[styles.meetingTitleText, { color: themeColors.text }]}
          numberOfLines={1}
        >
          {meeting.title}
        </Text>

        <View style={styles.meetingMetaRow}>
          {/* Day & Time */}
          <Text style={[styles.meetingSubtitleText, { color: themeColors.textMuted }]}>
            {formatDayAndTime(meeting.startDate)}
          </Text>

          {/* Location (if present) */}
          {(meeting.location || meeting.meetUrl) && (
            <>
              <Text style={[styles.metaDot, { color: themeColors.textMuted }]}>|</Text>
              <View style={styles.metaItem}>
                <Icon
                  name={meeting.meetUrl ? 'video' : 'map-pin'}
                  size={11}
                  color={themeColors.textMuted}
                />
                <Text
                  style={[styles.locationText, { color: themeColors.textMuted }]}
                  numberOfLines={1}
                >
                  {meeting.location ||
                    (meeting.platform === 'google_meet'
                      ? 'Google Meet'
                      : meeting.platform === 'zoom'
                      ? 'Zoom'
                      : 'Virtual')}
                </Text>
              </View>
            </>
          )}

          <Text style={[styles.metaDot, { color: themeColors.textMuted }]}>|</Text>

          {/* Attendees */}
          <View style={styles.metaItem}>
            <Icon name="users" size={11} color={themeColors.textMuted} />
            <Text style={[styles.attendeePillText, { color: themeColors.textMuted }]}>
              {formatAttendeeCount(meeting.attendees.length)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  meetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 76,
    marginBottom: 10,
  },
  dateBox: {
    width: 48,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  dateDayText: {
    fontFamily: fontFamilies.serif,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  dateMonthText: {
    fontFamily: fontFamilies.serif,
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 1,
  },
  meetingInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  meetingTitleText: {
    fontFamily: fontFamilies.sans,
    fontSize: 15.5,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  meetingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  meetingSubtitleText: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
  },
  metaDot: {
    fontSize: 11,
    marginHorizontal: 6,
    opacity: 0.4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    maxWidth: 120,
  },
  attendeePillText: {
    fontFamily: fontFamilies.sans,
    fontSize: 12,
    fontWeight: '500',
  },
});
