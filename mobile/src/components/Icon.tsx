import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../theme/tokens';

/**
 * Feather is the house icon set — thin, geometric, and quiet enough to sit
 * next to the type without competing with it. The two exceptions are routed
 * through here rather than imported ad hoc, so call sites only ever see `Icon`.
 */
export type IconName =
  | React.ComponentProps<typeof Feather>['name']
  /** Ionicons has a proper sparkle; Feather does not. */
  | 'sparkles'
  /** Brand mark for the Google sign-in button. */
  | 'google';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export default function Icon({ name, size = 16, color = colors.textSecondary, style }: IconProps) {
  if (name === 'sparkles') {
    return <Ionicons name="sparkles" size={size} color={color} style={style} />;
  }
  if (name === 'google') {
    return <AntDesign name="google" size={size} color={color} style={style} />;
  }
  return <Feather name={name} size={size} color={color} style={style} />;
}
