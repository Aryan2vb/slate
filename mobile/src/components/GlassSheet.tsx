import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { colors, radius, space, type } from '../theme/tokens';

interface GlassSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}

/**
 * Editorial bottom sheet on a calm paper-tinted scrim.
 */
export default function GlassSheet({ visible, onClose, title, subtitle, children }: GlassSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(140)} style={styles.fill}>
        <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(31, 36, 33, 0.32)' }]} />
        </BlurView>

        <Pressable style={styles.fill} onPress={onClose} accessibilityLabel="Dismiss" />

        <Animated.View entering={FadeInDown.duration(280).springify().damping(18)} style={styles.sheetWrap}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.grabber} />
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {children}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    padding: space.md,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.xxl,
    paddingTop: space.md,
    paddingBottom: space.xxxl,
    shadowColor: '#1F2421',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 6,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DCDAD2',
    marginBottom: space.xl,
  },
  title: {
    ...type.title,
    color: colors.text,
    marginBottom: space.xs,
  },
  subtitle: {
    ...type.body,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: space.xl,
  },
});
