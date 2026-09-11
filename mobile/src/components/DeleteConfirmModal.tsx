import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import Icon from './Icon';
import { useTheme } from '../context/ThemeContext';
import { fontFamilies } from '../theme/tokens';

/**
 * Transitions.dev Motion Tokens (Modal Open / Close)
 * Sourced from .agents/skills/transitions-dev/06-modal.md & transitions-polish:
 * - --modal-open-dur: 250ms (--duration-fast)
 * - --modal-close-dur: 150ms (--duration-quick)
 * - --modal-scale: 0.96 (--scale-large)
 * - --modal-scale-close: 0.96
 * - --modal-ease: cubic-bezier(0.22, 1, 0.36, 1) (--ease-smooth-out)
 * - --duration-stagger: 40ms
 */
const DURATION_OPEN = 250;
const DURATION_CLOSE = 150;
const SCALE_RESTING = 1.0;
const SCALE_PRE = 0.96;
const EASING_SMOOTH = Easing.bezier(0.22, 1, 0.36, 1);

interface DeleteConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const { colors: themeColors, isDark } = useTheme();

  // Internal visibility to allow close animation to finish before unmounting native Modal
  const [isRendered, setIsRendered] = useState(visible);
  const [reduceMotion, setReduceMotion] = useState(false);
  const isClosingRef = useRef(false);

  // Animated values
  const cardScale = useSharedValue(SCALE_PRE);
  const cardOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0.8);
  const badgeOpacity = useSharedValue(0);

  // Check prefers-reduced-motion accessibility preference
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => sub.remove();
  }, []);

  // Handle open / close animation sequence
  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      isClosingRef.current = false;

      if (reduceMotion) {
        cardScale.value = SCALE_RESTING;
        cardOpacity.value = 1;
        backdropOpacity.value = 1;
        badgeScale.value = 1;
        badgeOpacity.value = 1;
        return;
      }

      // Pre-animation state
      cardScale.value = SCALE_PRE;
      cardOpacity.value = 0;
      backdropOpacity.value = 0;
      badgeScale.value = 0.8;
      badgeOpacity.value = 0;

      // 1. Backdrop enters (250ms, ease-smooth-out)
      backdropOpacity.value = withTiming(1, {
        duration: DURATION_OPEN,
        easing: EASING_SMOOTH,
      });

      // 2. Modal card scales from 0.96 to 1.0 (250ms, ease-smooth-out)
      cardScale.value = withTiming(SCALE_RESTING, {
        duration: DURATION_OPEN,
        easing: EASING_SMOOTH,
      });
      cardOpacity.value = withTiming(1, {
        duration: DURATION_OPEN,
        easing: EASING_SMOOTH,
      });

      // 3. Staggered badge entrance (40ms offset, subtle spring settle)
      badgeScale.value = withDelay(
        40,
        withSpring(1, { damping: 16, stiffness: 240 })
      );
      badgeOpacity.value = withDelay(
        40,
        withTiming(1, { duration: 180, easing: EASING_SMOOTH })
      );
    } else if (isRendered && !isClosingRef.current) {
      // Parent forced visible to false
      handleCloseAnimation(() => {});
    }
  }, [visible, reduceMotion]);

  // Android hardware back handler
  useEffect(() => {
    if (!isRendered) return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => backHandler.remove();
  }, [isRendered]);

  const handleCloseAnimation = (callback: () => void) => {
    isClosingRef.current = true;

    if (reduceMotion) {
      setIsRendered(false);
      isClosingRef.current = false;
      callback();
      return;
    }

    // Modal close asymmetry: 150ms quick retreat to 0.96 scale
    cardScale.value = withTiming(SCALE_PRE, {
      duration: DURATION_CLOSE,
      easing: EASING_SMOOTH,
    });
    cardOpacity.value = withTiming(0, {
      duration: DURATION_CLOSE,
      easing: EASING_SMOOTH,
    });
    backdropOpacity.value = withTiming(0, {
      duration: DURATION_CLOSE,
      easing: EASING_SMOOTH,
    });

    setTimeout(() => {
      setIsRendered(false);
      isClosingRef.current = false;
      callback();
    }, DURATION_CLOSE);
  };

  const handleClose = () => {
    if (isClosingRef.current) return;
    void Haptics.selectionAsync();
    handleCloseAnimation(onCancel);
  };

  const handleConfirm = () => {
    if (isClosingRef.current) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleCloseAnimation(onConfirm);
  };

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
    opacity: badgeOpacity.value,
  }));

  if (!isRendered) return null;

  return (
    <Modal
      visible={isRendered}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlayContainer}>
        {/* Animated Dim Backdrop with soft blur scrim */}
        <Animated.View style={[StyleSheet.absoluteFill, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
            {Platform.OS === 'ios' ? (
              <BlurView
                intensity={isDark ? 30 : 25}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              >
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: isDark
                        ? 'rgba(0,0,0,0.65)'
                        : 'rgba(0,0,0,0.38)',
                    },
                  ]}
                />
              </BlurView>
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(0,0,0,0.72)'
                      : 'rgba(0,0,0,0.45)',
                  },
                ]}
              />
            )}
          </Pressable>
        </Animated.View>

        {/* Centered Editorial Dialog Card with Scale 0.96 -> 1.0 Transition */}
        <Animated.View style={[styles.cardWrap, animatedCardStyle]}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.cardBorder,
              },
            ]}
          >

            
            {/* Title */}
            <Text style={[styles.title, { color: themeColors.text }]}>
              {title}
            </Text>

            {/* Message */}
            <Text
              style={[styles.message, { color: themeColors.textSecondary }]}
            >
              {message}
            </Text>

            {/* Buttons Row */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleClose}
                style={[
                  styles.cancelBtn,
                  {
                    backgroundColor: themeColors.pillBg,
                    borderColor: themeColors.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[styles.cancelBtnText, { color: themeColors.text }]}
                >
                  {cancelLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirm}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteBtnText}>{confirmLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 360,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: fontFamilies.serif,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontFamily: fontFamilies.sans,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  deleteBtnText: {
    fontFamily: fontFamilies.sans,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
