import { memo, useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  History as HistoryIcon,
  MoreHorizontal,
  Star,
  Trash2,
} from 'lucide-react-native';
import { useAppData } from '../../context/AppDataContext';
import { useTheme } from '../../context/ThemeContext';
import { usePreferences } from '../../context/PreferencesContext';
import {
  Card,
  EmptyState,
  ScreenContainer,
  SegmentedControl,
} from '../../components/ui';
import { filterAndSortHistory } from '../../utils/historyHelpers';

const STAR_GOLD = '#F59E0B';

function formatTimestamp(iso) {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const HistoryRowCard = memo(function HistoryRowCard({
  item,
  theme,
  isDark,
  onOpen,
  onToggleStar,
  onOpenMenu,
}) {
  const isStarred = Boolean(item.is_starred);
  const isDraft = item.status === 'draft';
  const displayTime = formatTimestamp(item.updated_at || item.created_at);

  return (
    <Card
      style={[
        styles.card,
        isStarred
          ? {
              backgroundColor: isDark ? '#1D2436' : '#FFFBEB',
              borderColor: isDark
                ? 'rgba(245, 158, 11, 0.35)'
                : 'rgba(245, 158, 11, 0.45)',
            }
          : null,
      ]}
    >
      <View style={styles.cardTopRow}>
        <Pressable
          onPress={() => onOpen(item)}
          style={styles.cardContentPress}
        >
          <View style={styles.metaRow}>
            <Text style={[theme.typography.small, { color: theme.colors.primary, fontWeight: '700' }]}>
              {item.calculator_name}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isDraft
                    ? theme.colors.warningSoft
                    : theme.colors.successSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: isDraft
                      ? theme.colors.warning
                      : theme.colors.success,
                  },
                ]}
              >
                {isDraft ? 'Draft' : 'Completed'}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[
                theme.typography.small,
                { color: theme.colors.textMuted, marginLeft: 'auto' },
              ]}
            >
              {displayTime}
            </Text>
          </View>

          <Text
            numberOfLines={2}
            style={[
              theme.typography.bodyMedium,
              { color: theme.colors.textSecondary, marginTop: 8 },
            ]}
          >
            {item.input_summary}
          </Text>

          {item.result_summary ? (
            <Text
              numberOfLines={1}
              selectable
              style={[
                theme.typography.h2,
                { color: theme.colors.text, marginTop: 4 },
              ]}
            >
              {item.result_summary}
            </Text>
          ) : null}
        </Pressable>

        <View style={styles.rightActions}>
          <Pressable
            onPress={() => onToggleStar(item)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={
              isStarred ? 'Unstar calculation' : 'Star calculation'
            }
            style={styles.actionIconBtn}
          >
            <Star
              size={20}
              color={isStarred ? STAR_GOLD : theme.colors.textMuted}
              fill={isStarred ? STAR_GOLD : 'transparent'}
            />
          </Pressable>
          <Pressable
            onPress={() => onOpenMenu(item)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="More actions"
            style={styles.actionIconBtn}
          >
            <MoreHorizontal size={18} color={theme.colors.textMuted} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
});

export default function HistoryScreen() {
  const { theme, isDark } = useTheme();
  const { triggerHaptic } = usePreferences();
  const {
    history,
    toggleStarHistoryEntry,
    removeHistoryEntry,
    clearAllHistory,
  } = useAppData();
  const router = useRouter();
  const [filter, setFilter] = useState('all');

  const starredCount = useMemo(
    () => history.filter((item) => Boolean(item.is_starred)).length,
    [history]
  );

  const filterOptions = useMemo(
    () => [
      { label: `All (${history.length})`, value: 'all' },
      { label: `Starred (${starredCount})`, value: 'starred' },
    ],
    [history.length, starredCount]
  );

  const visibleHistory = useMemo(
    () => filterAndSortHistory(history, filter),
    [history, filter]
  );

  const confirmClearEverything = useCallback(() => {
    Alert.alert(
      'Delete Starred Calculations Too?',
      `This will permanently delete all ${history.length} calculations, including ${starredCount} starred ${starredCount === 1 ? 'entry' : 'entries'}. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => clearAllHistory({ includeStarred: true }),
        },
      ]
    );
  }, [history.length, starredCount, clearAllHistory]);

  const handleClearHistory = useCallback(() => {
    if (history.length === 0) return;

    if (starredCount > 0) {
      Alert.alert(
        'Clear Calculation History?',
        'Choose whether to keep your starred calculations or delete everything.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear Non-Starred',
            onPress: () => clearAllHistory({ includeStarred: false }),
          },
          {
            text: 'Clear All History',
            style: 'destructive',
            onPress: confirmClearEverything,
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Clear Calculation History?',
      'Are you sure you want to clear your calculation history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear History',
          style: 'destructive',
          onPress: () => clearAllHistory({ includeStarred: false }),
        },
      ]
    );
  }, [history.length, starredCount, clearAllHistory, confirmClearEverything]);

  const handleOpenEntry = useCallback(
    (item) => {
      if (item.calculator_id === 'basic') {
        router.push({
          pathname: '/calculator/basic',
          params: {
            restoreId: String(item.id),
            restoreExpr: item.expression || item.input_summary,
          },
        });
        return;
      }
      router.push(`/calculator/${item.calculator_id}`);
    },
    [router]
  );

  const handleToggleStar = useCallback(
    (item) => {
      triggerHaptic('selection');
      toggleStarHistoryEntry(item.id);
    },
    [triggerHaptic, toggleStarHistoryEntry]
  );

  const handleOpenMenu = useCallback(
    (item) => {
      const copyText = item.result_summary
        ? `${item.input_summary} = ${item.result_summary}`
        : item.input_summary;

      Alert.alert(
        item.calculator_name,
        copyText,
        [
          {
            text: 'Copy Result',
            onPress: () => {
              Clipboard.setStringAsync(
                item.result_summary || item.input_summary
              ).catch(() => {});
            },
          },
          {
            text: 'Share',
            onPress: () => {
              Share.share({
                message: `${item.calculator_name}: ${copyText}\n\nCalculated with One Calculator`,
              }).catch(() => {});
            },
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => removeHistoryEntry(item.id),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    },
    [removeHistoryEntry]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <HistoryRowCard
        item={item}
        theme={theme}
        isDark={isDark}
        onOpen={handleOpenEntry}
        onToggleStar={handleToggleStar}
        onOpenMenu={handleOpenMenu}
      />
    ),
    [theme, isDark, handleOpenEntry, handleToggleStar, handleOpenMenu]
  );

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.container}>
        {/* Modern Header */}
        <View style={styles.header}>
          <View>
            <Text style={[theme.typography.h1, { color: theme.colors.text }]}>
              Calculation History
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textMuted, marginTop: 2 },
              ]}
            >
              {history.length} saved · {starredCount} starred
            </Text>
          </View>
          {history.length > 0 ? (
            <Pressable
              onPress={handleClearHistory}
              hitSlop={8}
              style={[
                styles.clearButton,
                { backgroundColor: theme.colors.dangerSoft },
              ]}
            >
              <Trash2 size={14} color={theme.colors.danger} />
              <Text
                style={[
                  theme.typography.small,
                  {
                    color: theme.colors.danger,
                    fontWeight: '700',
                    marginLeft: 5,
                  },
                ]}
              >
                Clear
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* All / Starred Filter */}
        <View style={styles.filterWrap}>
          <SegmentedControl
            options={filterOptions}
            value={filter}
            onChange={setFilter}
          />
        </View>

        {visibleHistory.length === 0 ? (
          <View style={styles.emptyWrap}>
            {filter === 'starred' ? (
              <EmptyState
                icon={<Star size={28} color={STAR_GOLD} />}
                title="No starred calculations yet."
                description="Star important calculations to find them quickly."
                actionTitle="View All History"
                onAction={() => setFilter('all')}
              />
            ) : (
              <EmptyState
                icon={<HistoryIcon size={28} color={theme.colors.textMuted} />}
                title="No calculations yet."
                description="Your calculations will appear here automatically."
                actionTitle="Open Basic Calculator"
                onAction={() => router.push('/calculator/basic')}
              />
            )}
          </View>
        ) : (
          <FlatList
            data={visibleHistory}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            showsVerticalScrollIndicator={false}
            initialNumToRender={12}
            windowSize={7}
            removeClippedSubviews
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  filterWrap: {
    marginBottom: 14,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 28,
  },
  card: {
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardContentPress: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rightActions: {
    paddingLeft: 10,
    alignItems: 'center',
    gap: 12,
  },
  actionIconBtn: {
    padding: 2,
  },
});
