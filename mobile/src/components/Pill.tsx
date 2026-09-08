import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, space, type } from '../theme/tokens';

export type PillTone =
  /** Neutral metadata pill (Notion tag style) */
  | 'neutral'
  /** Forest Matcha accent */
  | 'accent'
  /** Subtle AI marginalia pill */
  | 'ai'
  /** Recording / live pulse pill */
  | 'live'
  /** Synced / confirmed pill */
  | 'success';

interface PillProps {
  label: string;
  tone?: PillTone;
  icon?: React.ReactNode;
  caps?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TONES: Record<PillTone, { bg: string; border: string; fg: string }> = {
  neutral: { bg: '#F0EFEA', border: '#E2E0D8', fg: colors.textSecondary },
  accent: { bg: colors.accentTint, border: colors.accentBorder, fg: colors.accent },
  ai: { bg: colors.aiCard, border: colors.aiBorder, fg: colors.accent },
  live: { bg: colors.liveTint, border: colors.liveBorder, fg: colors.live },
  success: { bg: colors.accentTint, border: colors.accentBorder, fg: colors.accent },
};

export default function Pill({ label, tone = 'neutral', icon, caps = false, style }: PillProps) {
  const textStyle = [styles.label, caps && styles.caps];
  const t = TONES[tone];

  return (
    <View style={[styles.base, { backgroundColor: t.bg, borderColor: t.border }, style]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[textStyle, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    ...type.meta,
  },
  caps: {
    ...type.eyebrow,
    fontSize: 10,
  },
});
