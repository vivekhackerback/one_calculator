import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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

  const handleSelectCategory = useCallback(
    (categoryId) => {
      setSelectedCategory(categoryId);
      if (paramCategory) {
        router.setParams({ category: '' });
      }
    },
    [paramCategory, router]
  );

  const filteredCalculators = useMemo(
    () => filterCalculators({ category: activeCategory, query: searchQuery }),
    [activeCategory, searchQuery]
  );

  const clearFilters = useCallback(() => {
    handleSelectCategory('all');
    setSearchQuery('');
  }, [handleSelectCategory]);

  const handleOpenCalculator = useCallback(
    (id) => {
      router.push(`/calculator/${id}`);
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <CalculatorCard
        calculator={item}
        isFavorite={isCalculatorFavorite(item.id)}
        onToggleFavorite={toggleFavoriteCalculator}
        onPress={() => handleOpenCalculator(item.id)}
      />
    ),
    [isCalculatorFavorite, toggleFavoriteCalculator, handleOpenCalculator]
  );

  const listHeader = useMemo(
    () => (
      <View>
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
      </View>
    ),
    [
      theme,
      searchQuery,
      activeCategory,
      filteredCalculators.length,
      handleSelectCategory,
    ]
  );

  return (
    <ScreenContainer scroll={false}>
      <FlatList
        data={filteredCalculators}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState
            icon={<SearchX size={28} color={theme.colors.textMuted} />}
            title="No calculators found"
            description="Try a different keyword or clear the active category filter."
            actionTitle="Clear Filters"
            onAction={clearFilters}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        windowSize={5}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
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
});
