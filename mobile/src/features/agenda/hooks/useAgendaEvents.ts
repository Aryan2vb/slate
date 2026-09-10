import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';

import { MeetingAttendee, MeetingEvent } from '../../../types/calendar';
import { useMeetingStore } from '../../../store/useMeetingStore';

interface UseAgendaEventsParams {
  authUser: { email?: string; name?: string; picture?: string } | null;
  refreshAccessToken?: () => Promise<string | null>;
  isDark: boolean;
  onStartCopilot?: (meeting: MeetingEvent) => void;
}

export function useAgendaEvents({
  authUser,
  refreshAccessToken,
  isDark,
  onStartCopilot,
}: UseAgendaEventsParams) {
  const {
    events,
    isLoading,
    isRefreshing,
    fetchMeetings,
    isTokenExpired,
    signOut: meetingSignOut,
  } = useMeetingStore();

  const [currentTime, setCurrentTime] = useState(Date.now());

  // Real-time periodic clock: updates every 15s so ended events drop off immediately and next up updates live
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const [showMore, setShowMore] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingEvent | null>(null);
  const [attendeeModalMeeting, setAttendeeModalMeeting] = useState<MeetingEvent | null>(null);
  const [showAttendeeDropdown, setShowAttendeeDropdown] = useState(false);
  const [quickMeetingNotes, setQuickMeetingNotes] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  // Computed attendees for the modal, ensuring event creator / organizer is included
  const modalAttendees = useMemo<MeetingAttendee[]>(() => {
    if (!attendeeModalMeeting) return [];
    const rawList = attendeeModalMeeting.attendees || [];
    const org = attendeeModalMeeting.organizer;

    const list = [...rawList];

    if (org?.email) {
      const orgEmailLower = org.email.toLowerCase();
      const existingIdx = list.findIndex(
        (a) => a.email?.toLowerCase() === orgEmailLower || a.isOrganizer
      );

      if (existingIdx >= 0) {
        list[existingIdx] = {
          ...list[existingIdx],
          isOrganizer: true,
          name: list[existingIdx].name || org.name,
        };
        if (existingIdx > 0) {
          const [orgItem] = list.splice(existingIdx, 1);
          list.unshift(orgItem);
        }
      } else {
        list.unshift({
          id: `organizer-${org.email}`,
          email: org.email,
          name: org.name || (org.email === authUser?.email ? authUser?.name || 'Me' : org.email),
          avatarUrl: org.email === authUser?.email ? authUser?.picture : undefined,
          responseStatus: 'accepted',
          isSelf: org.email === authUser?.email,
          isOrganizer: true,
        });
      }
    }
    return list;
  }, [attendeeModalMeeting, authUser]);

  const handleRefresh = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentTime(Date.now());
    await fetchMeetings(true, refreshAccessToken);
  }, [fetchMeetings, refreshAccessToken]);

  const handleSelectMeeting = useCallback((meeting: MeetingEvent) => {
    void Haptics.selectionAsync();
    setSelectedMeeting(meeting);
    setShowAttendeeDropdown(false);
    setQuickMeetingNotes('');
  }, []);

  const handleOpenMeeting = useCallback(
    async (meeting: MeetingEvent) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      let targetUrl = meeting.meetUrl;

      if (!targetUrl && meeting.location) {
        const loc = meeting.location.trim();
        if (
          /^https?:\/\//i.test(loc) ||
          /^(meet\.google\.com|zoom\.us|teams\.microsoft\.com)/i.test(loc)
        ) {
          targetUrl = /^https?:\/\//i.test(loc) ? loc : `https://${loc}`;
        }
      }

      if (!targetUrl && meeting.description) {
        const urlMatch = meeting.description.match(/https?:\/\/[^\s<>"')]+/);
        if (urlMatch) {
          targetUrl = urlMatch[0];
        }
      }

      if (!targetUrl && meeting.platform === 'google_meet') {
        targetUrl = 'https://meet.google.com';
      }

      if (!targetUrl && meeting.location) {
        const query = encodeURIComponent(meeting.location.trim());
        targetUrl =
          Platform.OS === 'ios'
            ? `https://maps.apple.com/?q=${query}`
            : `https://www.google.com/maps/search/?api=1&query=${query}`;
      }

      if (!targetUrl) {
        Alert.alert('No Meeting Link', 'This meeting does not have a video link or address.');
        return;
      }

      if (
        !/^https?:\/\//i.test(targetUrl) &&
        !/^maps:/i.test(targetUrl) &&
        !/^geo:/i.test(targetUrl)
      ) {
        targetUrl = `https://${targetUrl}`;
      }

      // Pass user's authenticated Google account so Google Meet opens with the active account
      if (
        authUser?.email &&
        (targetUrl.includes('meet.google.com') || targetUrl.includes('google.com'))
      ) {
        if (!targetUrl.includes('authuser=')) {
          const sep = targetUrl.includes('?') ? '&' : '?';
          targetUrl = `${targetUrl}${sep}authuser=${encodeURIComponent(
            authUser.email
          )}&login_hint=${encodeURIComponent(authUser.email)}`;
        }
      }

      try {
        if (/^https?:\/\//i.test(targetUrl)) {
          await WebBrowser.openBrowserAsync(targetUrl, {
            presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
            toolbarColor: isDark ? '#16171A' : '#FFFFFF',
            controlsColor: isDark ? '#93C5FD' : '#2563EB',
            showTitle: true,
            enableBarCollapsing: false,
          });
        } else {
          await Linking.openURL(targetUrl);
        }
      } catch (err) {
        console.warn(
          'Failed to open meeting URL with WebBrowser, falling back to Linking:',
          targetUrl,
          err
        );
        try {
          await Linking.openURL(targetUrl);
        } catch (linkErr) {
          Alert.alert('Unable to Open Link', 'Could not launch the meeting URL or map location.');
        }
      }
    },
    [authUser?.email, isDark]
  );

  const handleStartNotes = useCallback(
    (meeting?: MeetingEvent) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const target = meeting || selectedMeeting;
      setSelectedMeeting(null);
      if (target && onStartCopilot) {
        onStartCopilot(target);
      } else if (onStartCopilot) {
        const now = new Date();
        const later = new Date(Date.now() + 30 * 60_000);
        const fallbackMeeting: MeetingEvent = {
          id: `adhoc-${Date.now()}`,
          title: '',
          startDate: now,
          endDate: later,
          startTime: now.toISOString(),
          endTime: later.toISOString(),
          durationMinutes: 30,
          organizer: { email: authUser?.email || '', name: authUser?.name || 'Me' },
          attendees: [],
          platform: 'other',
          description: '',
          isAllDay: false,
          isConfirmed: true,
          isLiveNow: true,
        };
        onStartCopilot(fallbackMeeting);
      }
    },
    [authUser?.email, authUser?.name, onStartCopilot, selectedMeeting]
  );

  // Filter for upcoming or live events only (events that haven't ended yet)
  const upcomingEvents = useMemo(() => {
    return events
      .filter((ev) => ev.endDate.getTime() > currentTime)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [events, currentTime]);

  const displayedEvents = useMemo(() => {
    return showMore ? upcomingEvents : upcomingEvents.slice(0, 1);
  }, [showMore, upcomingEvents]);

  return {
    events,
    isLoading,
    isRefreshing,
    isTokenExpired,
    meetingSignOut,
    fetchMeetings,
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
  };
}
