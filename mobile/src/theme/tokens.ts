import { Platform } from 'react-native';

/**
 * Granola / Notion / Elephant design tokens.
 *
 * A calm, editorial, warm, typography-driven palette styled like high-end
 * digital stationery. No heavy neon gradients or dark cyberpunk glows.
 */

export const fontFamilies = {
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
};

export const colors = {
  /** Warm off-white / Oatmeal paper tint */
  bg: '#FBFBF9',
  bgOatmeal: '#F7F6F3',
  /** Paper cards resting on background */
  surface1: '#FFFFFF',
  /** Elevation 2 / nested editorial surfaces */
  surface2: '#F4F3EE',
  
  /** Ultra-fine hairline strokes */
  border: '#EBEAE5',
  borderStrong: '#DCDAD2',

  /** Deep earthy forest matcha green */
  accent: '#2D4F3C',
  accentHover: '#1E3A2F',
  accentTint: '#EDF3EF',
  accentBorder: '#C9DBCF',

  /** Subtle editorial AI tint */
  aiFrom: '#2D4F3C',
  aiTo: '#3B6851',
  aiCard: '#F7F6F2',
  aiBorder: '#E5E3D8',

  /** Crimson indicator for active recording */
  live: '#E02424',
  liveTint: '#FDE8E8',
  liveBorder: '#F8B4B4',

  /** Synced presence dot */
  presence: '#2D4F3C',

  /** High-contrast editorial ink */
  text: '#1F2421',
  textSecondary: '#5A6055',
  textMuted: '#7E827A',
  textSubtle: '#A2A69E',
} as const;

/** Subtle translucent washes */
export const alpha = {
  accentGlow: 'rgba(45, 79, 60, 0.08)',
  accentEdge: '#2D4F3C',
  aiGlow: 'rgba(45, 79, 60, 0.05)',
  aiEdge: '#2D4F3C',
  liveGlow: '#FDE8E8',
  liveEdge: '#F8B4B4',
  scrim: 'rgba(251, 251, 249, 0.94)',
  scrimSoft: 'rgba(251, 251, 249, 0.75)',
  hairline: '#EBEAE5',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  pill: 999,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
} as const;

/**
 * Editorial typography ramp: Georgia serif headers + clean sans body + mono timestamps.
 */
export const type = {
  display: { fontFamily: fontFamilies.serif, fontSize: 28, fontWeight: '700' as const, color: colors.text },
  title: { fontFamily: fontFamilies.serif, fontSize: 22, fontWeight: '700' as const, color: colors.text },
  serifHeading: { fontFamily: fontFamilies.serif, fontSize: 18, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 15, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 14, fontWeight: '400' as const, color: colors.text, lineHeight: 21 },
  meta: { fontSize: 12, fontWeight: '500' as const, color: colors.textMuted },
  eyebrow: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8, color: colors.accent },
  timer: { fontFamily: fontFamilies.mono, fontSize: 15, fontWeight: '600' as const, letterSpacing: 0.5 },
  mono: { fontFamily: fontFamilies.mono, fontSize: 12 },
} as const;

export const spring = { damping: 18, stiffness: 170, mass: 0.5 } as const;
export const layoutSpring = { damping: 16, stiffness: 140, mass: 0.7 } as const;
export const PRESS_SCALE = 0.98;
