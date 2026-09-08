/**
 * Consent Bottom Sheet Component
 * Executive pre-permission modal with micro-animations explaining
 * granular Google Calendar permissions before launching system OAuth.
 */

import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';

interface ConsentBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSkipToReviewerMode?: () => void;
  isLoading?: boolean;
}

const SCOPES = [
  {
    icon: 'calendar' as const,
    title: 'Read Calendar Agenda',
    scope: 'calendar.events.readonly',
    description: 'Enables automatic dossier synthesis 15 minutes before every meeting.',
    badge: 'Required',
  },
  {
    icon: 'edit' as const,
    title: 'Sync Executive Notes',
    scope: 'calendar.events',
    description: 'Allows exporting finalized meeting summaries and action items back into event attachments.',
    badge: 'Optional',
  },
  {
    icon: 'user' as const,
    title: 'Executive Identity',
    scope: 'openid · profile · email',
    description: 'Identifies you to distinguish your speech from external attendees.',
    badge: 'Required',
  },
];

export default function ConsentBottomSheet({
  visible,
  onClose,
  onConfirm,
  onSkipToReviewerMode,
  isLoading = false,
}: ConsentBottomSheetProps) {
  const insets = useSafeAreaInsets();

  const handleConfirm = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  const handleSkip = () => {
    void Haptics.selectionAsync();
    onClose();
    if (onSkipToReviewerMode) {
      onSkipToReviewerMode();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={StyleSheet.absoluteFill}
        >
          <Pressable style={styles.backdrop} onPress={onClose} />
        </Animated.View>

        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          exiting={SlideOutDown.duration(200)}
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
        >
          {/* Header handle */}
          <View style={styles.handleBar} />

          {/* Title Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Icon name="calendar" size={22} color="#6366F1" />
            </View>
            <Text style={styles.title}>Connect Google Calendar</Text>
            <Text style={styles.subtitle}>
              Granola analyzes upcoming attendees and agenda items to synthesize your private executive briefing.
            </Text>
          </View>

          {/* Scope Explanations */}
          <View style={styles.scopeContainer}>
            {SCOPES.map((item, index) => (
              <Animated.View
                key={item.scope}
                entering={FadeInDown.delay(100 + index * 60).duration(300)}
                style={styles.scopeCard}
              >
                <View style={styles.scopeIconWrap}>
                  <Icon name={item.icon} size={16} color="#6366F1" />
                </View>
                <View style={styles.scopeContent}>
                  <View style={styles.scopeHeaderRow}>
                    <Text style={styles.scopeTitle}>{item.title}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  </View>
                  <Text style={styles.scopeDescription}>{item.description}</Text>
                  <Text style={styles.scopeTag}>{item.scope}</Text>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Privacy Security Callout */}
          <View style={styles.securityPill}>
            <View style={styles.secureDot} />
            <Text style={styles.securityText}>
              Zero training on executive calendar data · SOC2 Type II Certified
            </Text>
          </View>

          {/* Action CTAs */}
          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isLoading}
              onPress={handleConfirm}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Authorizing…' : 'Authorize with Google'}
              </Text>
            </TouchableOpacity>

            {onSkipToReviewerMode ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSkip}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>
                  Explore Sample Agenda (Reviewer Mode) →
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#16181D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: '#23272F',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#374151',
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  scopeContainer: {
    gap: 10,
    marginBottom: 16,
  },
  scopeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0D0E11',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#23272F',
    gap: 12,
  },
  scopeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  scopeContent: {
    flex: 1,
  },
  scopeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  scopeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  scopeDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
    marginBottom: 4,
  },
  scopeTag: {
    fontSize: 11,
    color: '#6366F1',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 20,
    gap: 8,
  },
  secureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  securityText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#10B981',
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    textDecorationLine: 'underline',
  },
});
