import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function SegmentedControl({ options, value, onChange, style }) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceSecondary,
          borderRadius: theme.radii.md,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              {
                backgroundColor: selected ? theme.colors.surface : 'transparent',
                borderRadius: theme.radii.sm,
              },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                theme.typography.caption,
                {
                  color: selected ? theme.colors.primary : theme.colors.textSecondary,
                  fontWeight: selected ? '700' : '500',
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 4,
    borderWidth: 1,
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
