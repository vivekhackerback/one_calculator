import { Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AlertCircle, RotateCcw, Star } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Button, Card, ScreenContainer } from '../ui';

export function CalculatorLayout({
  title,
  description = '',
  children,
  onCalculate = null,
  onReset = null,
  calculateLabel = 'Calculate',
  error = '',
  result = null,
  isFavorite = false,
  onToggleFavorite = null,
  hideActions = false,
}) {
  const { theme } = useTheme();

  return (
    <ScreenContainer>
      <Stack.Screen
        options={{
          title,
          headerRight: onToggleFavorite
            ? () => (
                <Pressable onPress={onToggleFavorite} hitSlop={10} style={styles.favBtn}>
                  <Star
                    size={22}
                    color={isFavorite ? '#F59E0B' : theme.colors.textMuted}
                    fill={isFavorite ? '#F59E0B' : 'transparent'}
                  />
                </Pressable>
              )
            : undefined,
        }}
      />

      {description ? (
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textMuted, marginBottom: 14 },
          ]}
        >
          {description}
        </Text>
      ) : null}

      <Card>{children}</Card>

      {error ? (
        <View
          style={[
            styles.errorBox,
            {
              backgroundColor: theme.colors.dangerSoft,
              borderColor: theme.colors.danger,
              borderRadius: theme.radii.md,
            },
          ]}
        >
          <AlertCircle size={18} color={theme.colors.danger} />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.danger, marginLeft: 8, flex: 1 },
            ]}
          >
            {error}
          </Text>
        </View>
      ) : null}

      {!hideActions && (onCalculate || onReset) ? (
        <View style={styles.actionsRow}>
          {onReset ? (
            <Button
              title="Reset"
              variant="outline"
              onPress={onReset}
              style={styles.resetBtn}
              icon={<RotateCcw size={16} color={theme.colors.text} />}
            />
          ) : null}
          {onCalculate ? (
            <Button
              title={calculateLabel}
              variant="primary"
              onPress={onCalculate}
              style={styles.calcBtn}
            />
          ) : null}
        </View>
      ) : null}

      {result}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  favBtn: {
    padding: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 12,
    marginTop: 14,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  resetBtn: {
    flex: 1,
  },
  calcBtn: {
    flex: 2,
  },
});
