import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius as radii } from '../theme/tokens';

interface GradientBorderProps {
  children: React.ReactNode;
  /** Gradient stops for the stroke. Defaults to the AI signal ramp. */
  colorsRamp?: readonly [string, string, ...string[]];
  /** Stroke weight. Kept to 1–1.5 so it reads as a border, not a frame. */
  width?: number;
  radius?: number;
  /** Surface painted inside the stroke. */
  fill?: string;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
}

/**
 * Draws a gradient hairline around a card.
 *
 * React Native can't gradient-fill a real border, so this paints the gradient
 * as the outer surface and insets a solid fill by the stroke width.
 */
export default function GradientBorder({
  children,
  colorsRamp = [colors.aiFrom, colors.accent],
  width = 1.5,
  radius = radii.lg,
  fill = colors.surface1,
  style,
  innerStyle,
}: GradientBorderProps) {
  return (
    <LinearGradient
      colors={colorsRamp}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius: radius, padding: width }, style]}
    >
      <View
        style={[
          styles.inner,
          { backgroundColor: fill, borderRadius: radius - width },
          innerStyle,
        ]}
      >
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  inner: {
    overflow: 'hidden',
  },
});
