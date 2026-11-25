import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Search, SearchX, X } from 'lucide-react-native';
import { CATEGORIES, filterCalculators } from '../../constants/calculators';
import { useTheme } from '../../context/ThemeContext';
import { useAppData } from '../../context/AppDataContext';
import {
  CalculatorCard,
  CategoryChip,
  EmptyState,
  ScreenContainer,
} from '../../components/ui';

export default function ToolsScreen() {
  const { theme } = useTheme();
  const { isCalculatorFavorite, toggleFavoriteCalculator } = useAppData();
  const router = useRouter();
  const params = useLocalSearchParams();

  const paramCategory =
    typeof params.category === 'string' && params.category.length > 0
      ? params.category
      : null;

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeCategory = paramCategory || selectedCategory;

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    if (paramCategory) {
      router.setParams({ category: '' });
    }
  };

  const filteredCalculators = useMemo(
    () => filterCalculators({ category: activeCategory, query: searchQuery }),
    [activeCategory, searchQuery]
  );

  const clearFilters = () => {
    handleSelectCategory('all');
    setSearchQuery('');
  };

  return (
    <ScreenContainer>
      {/* Search Input */}
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
          placeholder="Search all 15 calculators..."
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

      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsRow}
        contentContainerStyle={styles.chipsContent}
      >
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.id}
            label={cat.name}
            color={cat.color}
            selected={activeCategory === cat.id}
            onPress={() => handleSelectCategory(cat.id)}
          />
        ))}
      </ScrollView>

      <Text
        style={[
          theme.typography.caption,
          { color: theme.colors.textMuted, marginBottom: 12 },
        ]}
      >
        Showing {filteredCalculators.length} of 15 calculators
      </Text>

      {filteredCalculators.length === 0 ? (
        <EmptyState
          icon={<SearchX size={28} color={theme.colors.textMuted} />}
          title="No calculators found"
          description="Try a different keyword or clear the active category filter."
          actionTitle="Clear Filters"
          onAction={clearFilters}
        />
      ) : (
        <View style={styles.listGap}>
          {filteredCalculators.map((calc) => (
            <CalculatorCard
              key={calc.id}
              calculator={calc}
              isFavorite={isCalculatorFavorite(calc.id)}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  chipsRow: {
    marginBottom: 14,
  },
  chipsContent: {
    paddingRight: 8,
  },
  listGap: {
    gap: 10,
  },
});
