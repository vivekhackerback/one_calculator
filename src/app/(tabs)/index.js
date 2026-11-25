import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Search, Star, X } from 'lucide-react-native';
import {
  CALCULATORS,
  CATEGORIES,
  filterCalculators,
  getCalculatorById,
} from '../../constants/calculators';
import { useTheme } from '../../context/ThemeContext';
import { useAppData } from '../../context/AppDataContext';
import { CalculatorCard, CalculatorIcon, Card, ScreenContainer } from '../../components/ui';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { favoriteIds, recentIds, toggleFavoriteCalculator, isCalculatorFavorite } =
    useAppData();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const popularCalculators = useMemo(
    () => CALCULATORS.filter((c) => c.isPopular),
    []
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return filterCalculators({ query: searchQuery });
  }, [searchQuery]);

  const favoriteCalculators = useMemo(
    () => favoriteIds.map((id) => getCalculatorById(id)).filter(Boolean),
    [favoriteIds]
  );

  const recentCalculators = useMemo(
    () => recentIds.map((id) => getCalculatorById(id)).filter(Boolean),
    [recentIds]
  );

  const categories = useMemo(
    () => CATEGORIES.filter((c) => c.id !== 'all'),
    []
  );

  const openCalculator = (id) => {
    router.push(`/calculator/${id}`);
  };

  return (
    <ScreenContainer>
      {/* Branding Header */}
      <View style={styles.brandSection}>
        <Text style={[theme.typography.hero, { color: theme.colors.text }]}>
          One Calculator
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textMuted, marginTop: 4 }]}>
          Everyday, financial, business, conversion & health tools
        </Text>
      </View>

      {/* Search Bar */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.lg,
          },
        ]}
      >
        <Search size={18} color={theme.colors.textMuted} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search 15 calculators (e.g. EMI, BMI, GST)..."
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.searchInput, theme.typography.body, { color: theme.colors.text }]}
          returnKeyType="search"
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <X size={18} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Live Search Results */}
      {searchQuery.trim().length > 0 ? (
        <View style={styles.section}>
          <Text style={[theme.typography.h2, { color: theme.colors.text, marginBottom: 12 }]}>
            Search Results ({searchResults.length})
          </Text>
          {searchResults.length === 0 ? (
            <Card>
              <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
                No calculators match &ldquo;{searchQuery}&rdquo;.
              </Text>
            </Card>
          ) : (
            <View style={styles.listGap}>
              {searchResults.map((calc) => (
                <CalculatorCard
                  key={calc.id}
                  calculator={calc}
                  isFavorite={isCalculatorFavorite(calc.id)}
                  onToggleFavorite={toggleFavoriteCalculator}
                  onPress={() => openCalculator(calc.id)}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <>
          {/* Quick Access to Favorites */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
                Favorites
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/favorites')}
                style={styles.seeAllBtn}
              >
                <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '600' }]}>
                  Manage
                </Text>
                <ChevronRight size={16} color={theme.colors.primary} />
              </Pressable>
            </View>
            {favoriteCalculators.length === 0 ? (
              <Card>
                <View style={styles.emptyFavRow}>
                  <Star size={18} color={theme.colors.textMuted} />
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.textMuted, marginLeft: 10, flex: 1 },
                    ]}
                  >
                    Tap the star on any calculator to pin it here for quick access.
                  </Text>
                </View>
              </Card>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {favoriteCalculators.map((calc) => (
                  <CalculatorCard
                    key={calc.id}
                    calculator={calc}
                    compact
                    onPress={() => openCalculator(calc.id)}
                    style={styles.horizontalCard}
                  />
                ))}
              </ScrollView>
            )}
          </View>

          {/* Recently Used */}
          {recentCalculators.length > 0 ? (
            <View style={styles.section}>
              <Text style={[theme.typography.h2, { color: theme.colors.text, marginBottom: 12 }]}>
                Recently Used
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recentCalculators.map((calc) => (
                  <CalculatorCard
                    key={calc.id}
                    calculator={calc}
                    compact
                    onPress={() => openCalculator(calc.id)}
                    style={styles.horizontalCard}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Popular Calculators */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[theme.typography.h2, { color: theme.colors.text }]}>
                Popular Calculators
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/tools')}
                style={styles.seeAllBtn}
              >
                <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '600' }]}>
                  All 15
                </Text>
                <ChevronRight size={16} color={theme.colors.primary} />
              </Pressable>
            </View>
            <View style={styles.grid}>
              {popularCalculators.map((calc) => (
                <CalculatorCard
                  key={calc.id}
                  calculator={calc}
                  compact
                  onPress={() => openCalculator(calc.id)}
                  style={styles.gridItem}
                />
              ))}
            </View>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={[theme.typography.h2, { color: theme.colors.text, marginBottom: 12 }]}>
              Categories
            </Text>
            <View style={styles.listGap}>
              {categories.map((cat) => {
                const count = CALCULATORS.filter((c) => c.category === cat.id).length;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() =>
                      router.push({ pathname: '/(tabs)/tools', params: { category: cat.id } })
                    }
                    style={({ pressed }) => [
                      styles.categoryRow,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radii.lg,
                        opacity: pressed ? 0.88 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.catIconBox,
                        { backgroundColor: `${cat.color}18`, borderRadius: theme.radii.md },
                      ]}
                    >
                      <CalculatorIcon name={cat.icon} size={22} color={cat.color} />
                    </View>
                    <View style={styles.catInfo}>
                      <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
                        {cat.name}
                      </Text>
                      <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
                        {count} {count === 1 ? 'calculator' : 'calculators'}
                      </Text>
                    </View>
                    <ChevronRight size={20} color={theme.colors.textMuted} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  brandSection: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyFavRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalCard: {
    width: 144,
    marginRight: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '48.5%',
  },
  listGap: {
    gap: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 14,
  },
  catIconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catInfo: {
    flex: 1,
    marginLeft: 12,
  },
});
