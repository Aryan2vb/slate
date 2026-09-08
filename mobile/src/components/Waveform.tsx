import React, { useEffect, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spring } from '../theme/tokens';

const BAR_COUNT = 9;
/** Bars near the centre swing hardest, like a real level meter. */
const CENTRE = (BAR_COUNT - 1) / 2;

interface BarProps {
  index: number;
  height: number;
  width: number;
  paused: boolean;
}

function Bar({ index, height, width, paused }: BarProps) {
  const scale = useSharedValue(0.12);

  /**
   * Two per-bar constants keep the row from marching in lockstep: a weight
   * that falls off toward the edges, and a slightly detuned tick interval.
   */
  const { weight, interval } = useMemo(() => {
    const distance = Math.abs(index - CENTRE) / CENTRE;
    return {
      weight: 0.35 + 0.65 * (1 - distance * distance),
      interval: 170 + index * 23,
    };
  }, [index]);

  useEffect(() => {
    if (paused) {
      scale.value = withTiming(0.08, { duration: 320 });
      return;
    }

    const tick = () => {
      // Simulated ambient level. A real mic feed would drive this same value.
      const target = 0.12 + Math.random() * 0.88 * weight;
      scale.value = withSpring(target, spring);
    };

    tick();
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval, paused, scale, weight]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: width / 2,
          overflow: 'hidden',
          transformOrigin: 'center',
        },
        animatedStyle,
      ]}
    >
      <LinearGradient
        colors={[colors.aiFrom, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

interface WaveformProps {
  /** When paused the bars settle to a flat idle line instead of freezing. */
  paused?: boolean;
  height?: number;
  barWidth?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * The centrepiece of the live screen: a nine-bar equalizer on spring physics.
 *
 * Each bar animates independently on the UI thread, so the stage keeps moving
 * smoothly even while the transcript feed is inserting new notes.
 */
export default function Waveform({
  paused = false,
  height = 96,
  barWidth = 6,
  style,
}: WaveformProps) {
  return (
    <View style={[styles.row, { height }, style]}>
      {Array.from({ length: BAR_COUNT }, (_, index) => (
        <Bar key={index} index={index} height={height} width={barWidth} paused={paused} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
