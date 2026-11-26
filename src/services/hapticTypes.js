export const HAPTIC_ACTION_SPECS = {
  number: { intensity: 'light', androidType: 'keyboard-tap', fallbackMs: 40 },
  operator: { intensity: 'light', androidType: 'keyboard-tap', fallbackMs: 40 },
  decimal: { intensity: 'light', androidType: 'keyboard-tap', fallbackMs: 40 },
  selection: { intensity: 'light', androidType: 'keyboard-tap', fallbackMs: 40 },
  light: { intensity: 'light', androidType: 'keyboard-tap', fallbackMs: 40 },
  delete: { intensity: 'medium', androidType: 'virtual-key', fallbackMs: 65 },
  clear: { intensity: 'medium', androidType: 'virtual-key', fallbackMs: 65 },
  equals: { intensity: 'medium', androidType: 'virtual-key', fallbackMs: 65 },
  medium: { intensity: 'medium', androidType: 'virtual-key', fallbackMs: 65 },
};

/**
 * Resolve the feedback specification for a given calculator/UI action type.
 */
export function getHapticSpec(actionType = 'light') {
  return HAPTIC_ACTION_SPECS[actionType] || HAPTIC_ACTION_SPECS.light;
}
