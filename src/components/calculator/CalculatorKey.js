import { memo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

export const CalculatorKey = memo(function CalculatorKey({
  keyId,
  label,
  icon = null,
  backgroundColor,
  pressedBackgroundColor,
  textColor,
  borderColor = 'transparent',
  borderRadius = 16,
  fontSize = 24,
  elevation = 3,
  style,
  onPressKey,
  onPressInKey,
  onPressInHaptic,
  accessibilityLabel,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (onPressInHaptic) {
      onPressInHaptic();
    }
    if (onPressInKey) {
      onPressInKey(keyId ?? label);
    }
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.94,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 2,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 95,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 95,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (onPressKey) {
      onPressKey(keyId ?? label);
    }
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [{ scale }, { translateY }],
        },
        style,
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        style={({ pressed }) => [
          styles.pressable,
          {
            backgroundColor:
              pressed && pressedBackgroundColor
                ? pressedBackgroundColor
                : backgroundColor,
            borderColor,
            borderRadius,
            elevation: pressed ? 1 : elevation,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: pressed ? 1 : 3 },
            shadowOpacity: pressed ? 0.05 : 0.14,
            shadowRadius: pressed ? 1 : 4,
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
