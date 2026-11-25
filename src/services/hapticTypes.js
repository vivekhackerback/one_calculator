export const HAPTIC_ACTION_SPECS = {
  number: { intensity: 'light', androidType: 'keyboard-tap', fallbackMs: 12 },
  operator: { intensity: 'light', androidType: 'keyboard-tap', fallbackMs: 12 },
  decimal: { intensity: 'light', androidType: 'keyboard-tap', fallbackMs: 12 },
  selection: { intensity: 'light', androidType: 'keyboard-tap', fallbackMs: 12 },
  light: { intensity: 'light', androidType: 'keyboard-tap', fallbackMs: 12 },
  delete: { intensity: 'medium', androidType: 'virtual-key', fallbackMs: 22 },
  clear: { intensity: 'medium', androidType: 'virtual-key', fallbackMs: 22 },
  equals: { intensity: 'medium', androidType: 'virtual-key', fallbackMs: 22 },
  medium: { intensity: 'medium', androidType: 'virtual-key', fallbackMs: 22 },
};

/**
 * Resolve the feedback specification for a given calculator/UI action type.
 */
export function getHapticSpec(actionType = 'light') {
  return HAPTIC_ACTION_SPECS[actionType] || HAPTIC_ACTION_SPECS.light;
}
