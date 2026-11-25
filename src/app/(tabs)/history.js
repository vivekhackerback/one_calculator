import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Copy, History as HistoryIcon, Trash2 } from 'lucide-react-native';
import { useAppData } from '../../context/AppDataContext';
import { useTheme } from '../../context/ThemeContext';
import { Button, Card, EmptyState, ScreenContainer } from '../../components/ui';

function formatTimestamp(iso) {
  try {
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function HistoryScreen() {
  const { theme } = useTheme();
  const { history, removeHistoryEntry, clearAllHistory } = useAppData();
  const router = useRouter();

  const handleClearAll = () => {
    Alert.alert(
      'Clear Calculation History',
      'Are you sure you want to delete all saved calculation history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => clearAllHistory(),
        },
      ]
    );
  };

  const handleCopy = async (item) => {
    try {
      await Clipboard.setStringAsync(
        `${item.calculator_name}: ${item.input_summary} => ${item.result_summary}`
      );
    } catch {
      // Ignore
    }
  };

  return (
    <ScreenContainer>
      {history.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon size={28} color={theme.colors.textMuted} />}
          title="No History Yet"
          description="Your recent calculations across all 15 calculators will appear here."
          actionTitle="Open Calculators"
          onAction={() => router.push('/(tabs)/tools')}
        />
      ) : (
        <>
          <View style={styles.topRow}>
            <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
              {history.length} {history.length === 1 ? 'calculation' : 'calculations'}
            </Text>
            <Button
              title="Clear All"
              variant="ghost"
              onPress={handleClearAll}
              style={styles.clearBtn}
              textStyle={{ color: theme.colors.danger, fontSize: 13 }}
            />
          </View>

          <View style={styles.list}>
            {history.map((item) => (
              <Card key={item.id} style={styles.card}>
                <Pressable
                  onPress={() => router.push(`/calculator/${item.calculator_id}`)}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[theme.typography.label, { color: theme.colors.primary }]}>
                      {item.calculator_name}
                    </Text>
                    <Text style={[theme.typography.small, { color: theme.colors.textMuted }]}>
                      {formatTimestamp(item.created_at)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.textSecondary, marginTop: 6 },
                    ]}
                  >
                    {item.input_summary}
                  </Text>
                  <Text
                    selectable
                    style={[
                      theme.typography.h3,
                      { color: theme.colors.text, marginTop: 4 },
                    ]}
                  >
                    {item.result_summary}
                  </Text>
                </Pressable>

                <View style={[styles.cardActions, { borderTopColor: theme.colors.border }]}>
                  <Pressable onPress={() => handleCopy(item)} style={styles.iconAction}>
                    <Copy size={15} color={theme.colors.textMuted} />
                    <Text
                      style={[
                        theme.typography.small,
                        { color: theme.colors.textMuted, marginLeft: 5 },
                      ]}
                    >
                      Copy
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => removeHistoryEntry(item.id)}
                    style={styles.iconAction}
                  >
                    <Trash2 size={15} color={theme.colors.danger} />
                    <Text
                      style={[
                        theme.typography.small,
                        { color: theme.colors.danger, marginLeft: 5 },
                      ]}
                    >
                      Delete
                    </Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  clearBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  list: {
    gap: 10,
  },
  card: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 18,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  iconAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
