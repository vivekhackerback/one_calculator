import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { getCategoryById } from '../../constants/calculators';
import { useTheme } from '../../context/ThemeContext';
import { CalculatorIcon } from './CalculatorIcon';

export const CalculatorCard = memo(function CalculatorCard({
  calculator,
  onPress,
  isFavorite = false,
  onToggleFavorite = null,
  compact = false,
  style,
}) {
  const { theme } = useTheme();
  const category = getCategoryById(calculator.category);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          padding: compact ? 12 : 16,
          opacity: pressed ? 0.88 : 1,
        },
        style,
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: `${category.color}18`,
              borderRadius: theme.radii.md,
            },
          ]}
        >
          <CalculatorIcon name={calculator.icon} size={22} color={category.color} />
        </View>
        {onToggleFavorite ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleFavorite(calculator.id);
            }}
            hitSlop={10}
          >
            <Star
              size={18}
              color={isFavorite ? '#F59E0B' : theme.colors.textMuted}
              fill={isFavorite ? '#F59E0B' : 'transparent'}
            />
          </Pressable>
        ) : null}
      </View>

      <Text
        numberOfLines={1}
        style={[
          theme.typography.h3,
          { color: theme.colors.text, marginTop: 12 },
        ]}
      >
        {compact ? calculator.shortName : calculator.name}
      </Text>

      {!compact ? (
        <Text
          numberOfLines={2}
          style={[
            theme.typography.caption,
            { color: theme.colors.textMuted, marginTop: 4 },
          ]}
        >
          {calculator.description}
        </Text>
      ) : (
        <Text
          numberOfLines={1}
          style={[
            theme.typography.small,
            { color: category.color, marginTop: 4 },
          ]}
        >
          {category.name}
        </Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
