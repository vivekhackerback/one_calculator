import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Calculator,
  ChevronRight,
  Search,
  Star,
  X,
} from 'lucide-react-native';
import {
  CALCULATORS,
  CATEGORIES,
  filterCalculators,
  getCalculatorById,
} from '../../constants/calculators';
import { useTheme } from '../../context/ThemeContext';
import { useAppData } from '../../context/AppDataContext';
import {
  CalculatorCard,
  CalculatorIcon,
  Card,
  ScreenContainer,
} from '../../components/ui';

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const {
    favoriteIds,
    recentIds,
    history,
    toggleFavoriteCalculator,
    isCalculatorFavorite,
  } = useAppData();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const popularCalculators = useMemo(
    () => CALCULATORS.filter((c) => c.isPopular && c.id !== 'basic'),
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

  const starredCount = useMemo(
    () => history.filter((item) => Boolean(item.is_starred)).length,
    [history]
  );

  const openCalculator = useCallback(
    (id) => {
      router.push(`/calculator/${id}`);
    },
    [router]
  );

  return (
    <ScreenContainer>
      {/* Top Hero Greeting & Quick Stats */}
      <View style={styles.heroHeader}>
        <View style={styles.heroTitleBlock}>
          <Text style={[theme.typography.hero, { color: theme.colors.text }]}>
            One Calculator
          </Text>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textMuted, marginTop: 2 },
            ]}
          >
            15 offline everyday, finance & unit tools
          </Text>
        </View>
        {history.length > 0 ? (
          <Pressable
            onPress={() => router.push('/(tabs)/history')}
            style={[
              styles.historyPill,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Star
              size={13}
              color="#F59E0B"
              fill={starredCount > 0 ? '#F59E0B' : 'transparent'}
            />
            <Text
              style={[
                theme.typography.small,
                { color: theme.colors.textSecondary, marginLeft: 5, fontWeight: '600' },
              ]}
            >
              {starredCount > 0 ? `${starredCount} Starred` : `${history.length} Saved`}
            </Text>
          </Pressable>
        ) : null}
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
          placeholder="Search calculators (EMI, BMI, GST, Age...)"
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.searchInput,
            theme.typography.body,
            { color: theme.colors.text },
          ]}
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
          <Text
            style={[
              theme.typography.h2,
              { color: theme.colors.text, marginBottom: 12 },
            ]}
          >
            Search Results ({searchResults.length})
          </Text>
          {searchResults.length === 0 ? (
            <Card>
              <Text
                style={[theme.typography.body, { color: theme.colors.textMuted }]}
              >
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
          {/* Primary Quick-Launch Basic Calculator Card */}
          <Pressable
            onPress={() => openCalculator('basic')}
            style={({ pressed }) => [
              styles.quickCalcCard,
              {
                backgroundColor: isDark ? '#172554' : theme.colors.primary,
                borderColor: isDark ? '#1E40AF' : theme.colors.primary,
                borderRadius: theme.radii.xl,
                opacity: pressed ? 0.92 : 1,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              },
            ]}
          >
            <View style={styles.quickCalcLeft}>
              <View style={styles.quickCalcIconWrap}>
                <Calculator size={24} color="#FFFFFF" />
              </View>
              <View style={styles.quickCalcTextWrap}>
                <Text style={styles.quickCalcTitle}>Basic Calculator</Text>
                <Text style={styles.quickCalcSubtitle}>
                  Instant math, Indian format &amp; auto-save
                </Text>
              </View>
            </View>
            <View style={styles.quickCalcArrow}>
              <ArrowRight size={18} color="#FFFFFF" />
            </View>
          </Pressable>

          {/* Recently Used */}
          {recentCalculators.length > 0 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
                  Recently Used
                </Text>
              </View>
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

          {/* Favorites */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
                Pinned Favorites
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/favorites')}
                style={styles.seeAllBtn}
              >
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.primary, fontWeight: '600' },
                  ]}
                >
                  {favoriteCalculators.length > 0 ? 'Manage' : 'Browse'}
                </Text>
                <ChevronRight size={15} color={theme.colors.primary} />
              </Pressable>
            </View>
            {favoriteCalculators.length === 0 ? (
              <Pressable
                onPress={() => router.push('/(tabs)/tools')}
                style={[
                  styles.emptyFavBanner,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radii.lg,
                  },
                ]}
              >
                <Star size={16} color="#F59E0B" />
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textMuted, marginLeft: 10, flex: 1 },
                  ]}
                >
                  Star any calculator to pin it here for one-tap access.
                </Text>
                <ChevronRight size={16} color={theme.colors.textMuted} />
              </Pressable>
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

          {/* Popular Calculators */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
                Popular Tools
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/tools')}
                style={styles.seeAllBtn}
              >
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.primary, fontWeight: '600' },
                  ]}
                >
                  All 15
                </Text>
                <ChevronRight size={15} color={theme.colors.primary} />
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
            <Text
              style={[
                theme.typography.h3,
                { color: theme.colors.text, marginBottom: 12 },
              ]}
            >
              Browse by Category
            </Text>
            <View style={styles.listGap}>
              {categories.map((cat) => {
                const count = CALCULATORS.filter(
                  (c) => c.category === cat.id
                ).length;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/tools',
                        params: { category: cat.id },
                      })
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
                        {
                          backgroundColor: `${cat.color}18`,
                          borderRadius: theme.radii.md,
                        },
                      ]}
                    >
                      <CalculatorIcon
                        name={cat.icon}
                        size={20}
                        color={cat.color}
                      />
                    </View>
                    <View style={styles.catInfo}>
                      <Text
                        style={[
                          theme.typography.bodyMedium,
                          { color: theme.colors.text, fontWeight: '600' },
                        ]}
                      >
                        {cat.name}
                      </Text>
                      <Text
                        style={[
                          theme.typography.small,
                          { color: theme.colors.textMuted, marginTop: 1 },
                        ]}
                      >
                        {count} {count === 1 ? 'calculator' : 'calculators'}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={theme.colors.textMuted} />
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
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  heroTitleBlock: {
    flex: 1,
  },
  historyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  quickCalcCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 22,
  },
  quickCalcLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  quickCalcIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCalcTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  quickCalcTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  quickCalcSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  quickCalcArrow: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyFavBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  horizontalCard: {
    width: 142,
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
    padding: 12,
  },
  catIconBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catInfo: {
    flex: 1,
    marginLeft: 12,
  },
});
