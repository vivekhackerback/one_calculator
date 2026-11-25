import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function CategoryChip({ label, selected = false, onPress, color }) {
  const { theme } = useTheme();
  const activeColor = color || theme.colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? activeColor : theme.colors.surface,
          borderColor: selected ? activeColor : theme.colors.border,
          borderRadius: theme.radii.full,
        },
      ]}
    >
      <Text
        style={[
          theme.typography.caption,
          {
            color: selected ? '#FFFFFF' : theme.colors.textSecondary,
            fontWeight: selected ? '600' : '500',
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 8,
  },
});
