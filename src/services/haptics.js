import { Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getHapticSpec } from './hapticTypes';

function resolveImpactStyle(intensity) {
  return intensity === 'medium'
    ? Haptics.ImpactFeedbackStyle.Medium
    : Haptics.ImpactFeedbackStyle.Light;
}

function resolveAndroidHapticType(androidType) {
  return androidType === 'virtual-key'
    ? Haptics.AndroidHaptics.Virtual_Key
    : Haptics.AndroidHaptics.Keyboard_Tap;
}

/**
 * Trigger immediate fire-and-forget haptic feedback on button touch-down.
 * Uses Android's View.performHapticFeedback (Keyboard_Tap / Virtual_Key) as
 * primary on Android because impactAsync(Light) uses low amplitude (30/255)
 * that is imperceptible on many Android motors, with safe fallbacks on error.
 */
export function triggerAppHaptic(actionType = 'light', { enabled = true } = {}) {
  if (!enabled) {
    return;
  }

  const spec = getHapticSpec(actionType);
  const impactStyle = resolveImpactStyle(spec.intensity);
  const androidHaptic = resolveAndroidHapticType(spec.androidType);

  if (Platform.OS === 'android') {
    // On Android, View.performHapticFeedback silently does nothing when system
    // "Touch vibration" is off, and expo-haptics impactAsync(Light) uses 30/255
    // amplitude that is imperceptible on many ERM motors. Vibration.vibrate(ms)
    // uses VibrationEffect.DEFAULT_AMPLITUDE directly and works reliably.
    try {
      Vibration.vibrate(spec.fallbackMs);
      return;
    } catch {
      Haptics.performAndroidHapticsAsync(androidHaptic).catch(() => {
        Haptics.impactAsync(impactStyle).catch(() => {});
      });
    }
    return;
  }

  Haptics.impactAsync(impactStyle).catch(() => {});
}
