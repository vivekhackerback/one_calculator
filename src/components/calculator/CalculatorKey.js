import { memo, useRef, useState } from 'react';
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
  onPressInHaptic,
  accessibilityLabel,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;
  const [isPressed, setIsPressed] = useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
    if (onPressInHaptic) {
      onPressInHaptic();
    }
    bgAnim.stopAnimation();
    bgAnim.setValue(1);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 0.95,
        speed: 65,
        bounciness: 0,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 2,
        speed: 65,
        bounciness: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        speed: 38,
        bounciness: 5,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        speed: 38,
        bounciness: 5,
        useNativeDriver: true,
      }),
    ]).start();
    Animated.timing(bgAnim, {
      toValue: 0,
      duration: 140,
      useNativeDriver: false,
    }).start();
  };

  const handlePress = () => {
    if (onPressKey) {
      onPressKey(keyId ?? label);
    }
  };

  const activeElevation = isPressed ? 1 : elevation;
  const animatedBg = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [backgroundColor, pressedBackgroundColor || backgroundColor],
  });

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
        style={[
          styles.pressableOuter,
          {
            borderRadius,
            elevation: activeElevation,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: isPressed ? 1 : 3 },
            shadowOpacity: isPressed ? 0.05 : 0.14,
            shadowRadius: isPressed ? 1 : 4,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.pressableInner,
            {
              backgroundColor: animatedBg,
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
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  pressableOuter: {
    flex: 1,
  },
  pressableInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: {
    fontWeight: '600',
  },
});
