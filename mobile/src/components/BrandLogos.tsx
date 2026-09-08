import React from 'react';
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
}

/**
 * Official Google "G" 4-Color Vector Logo
 */
export function GoogleLogo({ size = 20 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Blue */}
      <Path
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
        fill="#4285F4"
      />
      {/* Green */}
      <Path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
        fill="#34A853"
      />
      {/* Yellow */}
      <Path
        d="M5.28 14.27a7.203 7.203 0 010-4.54V6.58H1.25a11.97 11.97 0 000 10.84l4.03-3.15z"
        fill="#FBBC05"
      />
      {/* Red */}
      <Path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        fill="#EA4335"
      />
    </Svg>
  );
}

/**
 * Slate Official Brand Emblem
 * A sleek, modern monolithic tablet symbolizing a blank slate, 
 * clean paper, and ambient intelligence.
 */
export function SlateLogo({ size = 64 }: LogoProps) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Defs>
          {/* Surface subtle gradient */}
          <LinearGradient id="slateSlabGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#2A2B30" />
            <Stop offset="100%" stopColor="#141518" />
          </LinearGradient>
          {/* Accent glow gradient */}
          <LinearGradient id="slateSparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#E2E8F0" />
            <Stop offset="100%" stopColor="#94A3B8" />
          </LinearGradient>
        </Defs>

        {/* Outer subtle shadow/border card */}
        <Rect
          x="6"
          y="6"
          width="52"
          height="52"
          rx="14"
          fill="url(#slateSlabGrad)"
          stroke="#383A42"
          strokeWidth="1.5"
        />

        {/* Minimalist folded corner / slate document line */}
        <Path
          d="M20 22H38M20 30H44M20 38H32"
          stroke="#71717A"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* AI Copilot Sparkle / Ambient intelligence mark in upper right */}
        <Path
          d="M44 18L45.2 21.8L49 23L45.2 24.2L44 28L42.8 24.2L39 23L42.8 21.8L44 18Z"
          fill="#F59E0B"
        />

        {/* Micro accent dot */}
        <Circle cx="44" cy="38" r="2" fill="#10B981" />
      </Svg>
    </View>
  );
}
