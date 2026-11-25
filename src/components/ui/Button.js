import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon = null,
  disabled = false,
  style,
  textStyle,
}) {
  const { theme } = useTheme();

  const variantStyles = {
    primary: {
      bg: theme.colors.primary,
      border: theme.colors.primary,
      text: theme.colors.primaryText,
    },
    secondary: {
      bg: theme.colors.surfaceSecondary,
      border: theme.colors.border,
      text: theme.colors.text,
    },
    outline: {
      bg: 'transparent',
      border: theme.colors.border,
      text: theme.colors.text,
    },
    danger: {
      bg: theme.colors.danger,
      border: theme.colors.danger,
      text: '#FFFFFF',
    },
    ghost: {
      bg: 'transparent',
      border: 'transparent',
      text: theme.colors.primary,
    },
  }[variant] || {
    bg: theme.colors.primary,
    border: theme.colors.primary,
    text: theme.colors.primaryText,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: variantStyles.bg,
          borderColor: variantStyles.border,
          borderRadius: theme.radii.md,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text
          style={[
            theme.typography.bodyMedium,
            { color: variantStyles.text, fontWeight: '600' },
            textStyle,
          ]}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
});
