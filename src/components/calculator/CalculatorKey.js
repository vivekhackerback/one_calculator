import { memo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

export const CalculatorKey = memo(function CalculatorKey({
  label,
  icon = null,
  backgroundColor,
  pressedBackgroundColor,
  textColor,
  borderColor = 'transparent',
  borderRadius = 16,
  fontSize = 24,
  style,
  onPress,
  onPressInHaptic,
  accessibilityLabel,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPressInHaptic) {
      onPressInHaptic();
    }
    Animated.spring(scale, {
      toValue: 0.95,
      speed: 60,
      bounciness: 0,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      speed: 36,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        style={({ pressed }) => [
          styles.pressable,
          {
            backgroundColor: pressed && pressedBackgroundColor ? pressedBackgroundColor : backgroundColor,
            borderColor,
            borderRadius,
          },
        ]}
      >
        {icon || (
          <Text
            style={[
              styles.text,
              {
                color: textColor,
                fontSize,
              },
            ]}
          >
            {label}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  pressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: {
    fontWeight: '600',
  },
});
