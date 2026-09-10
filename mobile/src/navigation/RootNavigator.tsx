import React, { useEffect, useState } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import AgendaScreen from '../screens/AgendaScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DossierScreen from '../screens/DossierScreen';
import LiveCopilotScreen from '../screens/LiveCopilotScreen';
import CommandCenterScreen from '../screens/CommandCenterScreen';

import { Meeting } from '../data/meetings';
import { Objective } from '../data/intel';
import { MeetingEvent } from '../types/calendar';

export function meetingEventToMeeting(ev: MeetingEvent): Meeting {
  return {
    id: ev.id,
    title: ev.title,
    org: ev.organizer.name,
    startTime: ev.startDate,
    endTime: ev.endDate,
    tags: [
      ev.platform === 'google_meet'
        ? 'Google Meet'
        : ev.platform === 'zoom'
        ? 'Zoom'
        : ev.platform === 'teams'
        ? 'Teams'
        : 'Executive',
    ],
    people: ev.attendees.map((a) => ({
      id: a.id,
      name: a.name,
      avatarUrl: a.avatarUrl,
    })),
    location: ev.location || ev.meetUrl,
    description: ev.description,
  };
}

export type AppRoute =
  | { name: 'agenda' }
  | { name: 'profile' }
  | { name: 'command' }
  | { name: 'dossier'; meeting: Meeting }
  | { name: 'live'; meeting: Meeting; objectives: Objective[] };

export default function RootNavigator() {
  const [route, setRoute] = useState<AppRoute>({ name: 'agenda' });

  useEffect(() => {
    const onBackPress = () => {
      if (route.name !== 'agenda') {
        setRoute({ name: 'agenda' });
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [route.name]);

  switch (route.name) {
    case 'profile':
      return (
        <Animated.View key="profile" entering={FadeIn.duration(200)} style={styles.fill}>
          <ProfileScreen onBack={() => setRoute({ name: 'agenda' })} />
        </Animated.View>
      );

    case 'dossier':
      return (
        <Animated.View key="dossier" entering={FadeIn.duration(220)} style={styles.fill}>
          <DossierScreen
            meeting={route.meeting}
            onBack={() => setRoute({ name: 'agenda' })}
            onStart={(objectives) =>
              setRoute({ name: 'live', meeting: route.meeting, objectives })
            }
          />
        </Animated.View>
      );

    case 'live':
      return (
        <Animated.View key="live" entering={FadeIn.duration(220)} style={styles.fill}>
          <LiveCopilotScreen
            meeting={route.meeting}
            objectives={route.objectives}
            onEnd={() => setRoute({ name: 'agenda' })}
          />
        </Animated.View>
      );

    case 'command':
      return (
        <Animated.View key="command" entering={FadeIn.duration(220)} style={styles.fill}>
          <CommandCenterScreen
            onOpenMeeting={(meeting) => setRoute({ name: 'dossier', meeting })}
          />
        </Animated.View>
      );

    default:
      return (
        <Animated.View key="agenda" entering={FadeIn.duration(220)} style={styles.fill}>
          <AgendaScreen
            onOpenProfile={() => setRoute({ name: 'profile' })}
            onOpenDossier={(meetingEvent) =>
              setRoute({ name: 'dossier', meeting: meetingEventToMeeting(meetingEvent) })
            }
            onStartCopilot={(meetingEvent) =>
              setRoute({
                name: 'live',
                meeting: meetingEventToMeeting(meetingEvent),
                objectives: [],
              })
            }
          />
        </Animated.View>
      );
  }
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: '#161719',
  },
});
