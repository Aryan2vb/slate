import React, { useEffect } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface PulseDotProps {
  color: string;
  size?: number;
  /** One full breath, in ms. */
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A dot with a halo that breathes outward — the app's only "something is
 * happening right now" signal. Used for live recording and live presence.
 */
export default function PulseDot({ color, size = 8, duration = 1400, style }: PulseDotProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [duration, progress]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - progress.value),
    transform: [{ scale: 1 + progress.value * 1.6 }],
  }));

  return (
    <View style={[{ width: size * 3, height: size * 3, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size * 1.8,
            height: size * 1.8,
            borderRadius: size,
            backgroundColor: color,
          },
          haloStyle,
        ]}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}
