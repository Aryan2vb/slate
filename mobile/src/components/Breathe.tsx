import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface BreatheProps {
  children: React.ReactNode;
  /** One inhale, in ms. The full cycle is twice this. */
  duration?: number;
}

/**
 * Slowly pulses opacity and scale. Used sparingly — only on elements that
 * represent the copilot actively having something ready for you.
 */
export default function Breathe({ children, duration = 1100 }: BreatheProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [duration, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.55 + progress.value * 0.45,
    transform: [{ scale: 0.92 + progress.value * 0.16 }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
