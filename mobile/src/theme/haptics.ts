import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Nabla's tactile vocabulary. Each entry maps an *intent* to a physical
 * sensation, so call sites say what happened rather than how hard to buzz.
 *
 * The four tiers are deliberate: if everything is Heavy, nothing is.
 */
export type HapticIntent =
  /** Primary CTA press — the app committing to something. */
  | 'primary'
  /** Chip, pill, or toggle selection. Barely there. */
  | 'select'
  /** Flagging an action item or bookmark — a small win. */
  | 'flag'
  /** Ending a recording. The heaviest thing the app does. */
  | 'stop';

/**
 * Haptics are a no-op on web and are best-effort everywhere else: a failed
 * buzz must never interrupt the interaction it was decorating.
 */
export function tap(intent: HapticIntent): void {
  if (Platform.OS === 'web') return;

  const run = async () => {
    switch (intent) {
      case 'primary':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      case 'select':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      case 'flag':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'stop':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  void run().catch(() => {
    // Device has no haptic engine, or the user disabled it. Nothing to do.
  });
}
