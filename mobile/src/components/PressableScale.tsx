import React, { useCallback } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { PRESS_SCALE, spring } from '../theme/tokens';
import { HapticIntent, tap } from '../theme/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Which tactile tier this control belongs to. Pass null for controls that
   * should stay silent (e.g. a whole card that only navigates).
   */
  haptic?: HapticIntent | null;
  /** Override the compression target for oversized controls. */
  pressScale?: number;
}

/**
 * The single interactive primitive in Nabla.
 *
 * Compresses to 0.96 on press-in and springs back on release, and fires the
 * matching haptic at the *start* of the gesture so the buzz lands with the
 * finger rather than after the action completes.
 */
export default function PressableScale({
  children,
  style,
  haptic = 'primary',
  pressScale = PRESS_SCALE,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(
    (event: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
      scale.value = withSpring(pressScale, spring);
      if (haptic) tap(haptic);
      onPressIn?.(event);
    },
    [haptic, onPressIn, pressScale, scale],
  );

  const handlePressOut = useCallback(
    (event: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
      scale.value = withSpring(1, spring);
      onPressOut?.(event);
    },
    [onPressOut, scale],
  );

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle, disabled ? { opacity: 0.45 } : null]}
    >
      {children}
    </AnimatedPressable>
  );
}
