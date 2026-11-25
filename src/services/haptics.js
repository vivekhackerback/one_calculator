import { Platform, Vibration } from 'react-native';
import Constants from 'expo-constants';
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
    if (__DEV__) {
      console.log('[Haptics] Skipped because hapticEnabled preference is false');
    }
    return;
  }

  const spec = getHapticSpec(actionType);
  const impactStyle = resolveImpactStyle(spec.intensity);
  const androidHaptic = resolveAndroidHapticType(spec.androidType);

  if (__DEV__) {
    console.log('[Haptics] Invoking:', {
      actionType,
      intensity: spec.intensity,
      platform: Platform.OS,
      platformVersion: Platform.Version,
      executionEnvironment: Constants.executionEnvironment,
    });
  }

  if (Platform.OS === 'android') {
    Haptics.performAndroidHapticsAsync(androidHaptic)
      .then(() => {
        if (__DEV__) {
          console.log('[Haptics] performAndroidHapticsAsync resolved:', androidHaptic);
        }
      })
      .catch((err) => {
        if (__DEV__) {
          console.warn('[Haptics] performAndroidHapticsAsync rejected, trying impactAsync:', err);
        }
        return Haptics.impactAsync(impactStyle)
          .then(() => {
            if (__DEV__) {
              console.log('[Haptics] Android fallback impactAsync resolved:', impactStyle);
            }
          })
          .catch((impactErr) => {
            if (__DEV__) {
              console.warn('[Haptics] Android impactAsync rejected, trying Vibration.vibrate:', impactErr);
            }
            try {
              Vibration.vibrate(spec.fallbackMs);
            } catch (vibErr) {
              if (__DEV__) {
                console.warn('[Haptics] Vibration unavailable:', vibErr);
              }
            }
          });
      });
    return;
  }

  Haptics.impactAsync(impactStyle)
    .then(() => {
      if (__DEV__) {
        console.log('[Haptics] impactAsync resolved:', impactStyle);
      }
    })
    .catch((err) => {
      if (__DEV__) {
        console.warn('[Haptics] impactAsync rejected:', err);
      }
    });
}
