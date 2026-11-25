import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Star } from 'lucide-react-native';
import { getCalculatorById } from '../../constants/calculators';
import { useAppData } from '../../context/AppDataContext';
import { useTheme } from '../../context/ThemeContext';
import { CalculatorCard, EmptyState, ScreenContainer } from '../../components/ui';

export default function FavoritesScreen() {
  const { theme } = useTheme();
  const { favoriteIds, toggleFavoriteCalculator } = useAppData();
  const router = useRouter();

  const favoriteCalculators = useMemo(
    () => favoriteIds.map((id) => getCalculatorById(id)).filter(Boolean),
    [favoriteIds]
  );

  return (
    <ScreenContainer>
      {favoriteCalculators.length === 0 ? (
        <EmptyState
          icon={<Star size={28} color={theme.colors.textMuted} />}
          title="No Favorites Yet"
          description="Tap the star icon on any calculator to save it here for instant access."
          actionTitle="Browse Calculators"
          onAction={() => router.push('/(tabs)/tools')}
        />
      ) : (
        <View style={styles.list}>
          <Text style={[theme.typography.caption, { color: theme.colors.textMuted, marginBottom: 4 }]}>
            {favoriteCalculators.length} saved {favoriteCalculators.length === 1 ? 'calculator' : 'calculators'}
          </Text>
          {favoriteCalculators.map((calc) => (
            <CalculatorCard
              key={calc.id}
              calculator={calc}
              isFavorite
              onToggleFavorite={toggleFavoriteCalculator}
              onPress={() => router.push(`/calculator/${calc.id}`)}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
});
