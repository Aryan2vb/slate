import React from 'react';
import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, type } from '../theme/tokens';

export interface Person {
  id: string;
  name: string;
  title?: string;
  company?: string;
  /** Remote headshot. Falls back to initials when absent or broken. */
  avatarUrl?: string;
  /** Single-glyph brand mark badged onto the avatar (e.g. 'S' for Sequoia). */
  brandMark?: string;
  /** Brand colour backing that mark. */
  brandColor?: string;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/** Deterministic tint per person so the same face keeps the same colour. */
const TINTS = ['#3730A3', '#5B21B6', '#9D174D', '#155E75', '#166534', '#92400E'];
function tintFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return TINTS[hash % TINTS.length];
}

interface AvatarProps {
  person: Person;
  size?: number;
  /** Ring colour used to separate overlapping avatars from the surface behind. */
  ringColor?: string;
  showBrand?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({
  person,
  size = 34,
  ringColor = colors.bg,
  showBrand = true,
  style,
}: AvatarProps) {
  const badge = Math.max(13, Math.round(size * 0.42));

  return (
    <View style={[{ width: size, height: size }, style]}>
      {person.avatarUrl ? (
        <Image
          source={{ uri: person.avatarUrl }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: ringColor,
          }}
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: ringColor,
            backgroundColor: tintFor(person.id),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials(person.name)}</Text>
        </View>
      )}

      {showBrand && person.brandMark ? (
        <View
          style={[
            styles.brand,
            {
              width: badge,
              height: badge,
              borderRadius: badge / 2,
              backgroundColor: person.brandColor ?? colors.surface2,
              borderColor: ringColor,
            },
          ]}
        >
          <Text style={[styles.brandText, { fontSize: badge * 0.55 }]}>{person.brandMark}</Text>
        </View>
      ) : null}
    </View>
  );
}

interface AvatarStackProps {
  people: Person[];
  size?: number;
  /** Beyond this, the remainder collapses into a "+N" chip. */
  max?: number;
  ringColor?: string;
}

/**
 * Overlapping roster row. Later avatars sit *behind* earlier ones so the
 * leading face — usually the person who matters most — stays unclipped.
 */
export function AvatarStack({ people, size = 34, max = 4, ringColor = colors.bg }: AvatarStackProps) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;

  return (
    <View style={styles.stack}>
      {shown.map((person, index) => (
        <View
          key={person.id}
          style={{
            marginLeft: index === 0 ? 0 : -size * 0.3,
            zIndex: shown.length - index,
          }}
        >
          <Avatar person={person} size={size} ringColor={ringColor} />
        </View>
      ))}

      {overflow > 0 ? (
        <View
          style={[
            styles.overflow,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -size * 0.3,
              borderColor: ringColor,
            },
          ]}
        >
          <Text style={[styles.overflowText, { fontSize: size * 0.32 }]}>+{overflow}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  initials: {
    color: colors.text,
    fontWeight: '700',
  },
  brand: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: colors.text,
    fontWeight: '800',
  },
  overflow: {
    backgroundColor: colors.surface2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: {
    ...type.meta,
    color: colors.textSecondary,
  },
});
