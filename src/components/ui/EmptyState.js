import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Button } from './Button';

export function EmptyState({
  icon = null,
  title,
  description,
  actionTitle = '',
  onAction = null,
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {icon ? (
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: theme.colors.surfaceSecondary,
              borderRadius: theme.radii.full,
            },
          ]}
        >
          {icon}
        </View>
      ) : null}
      <Text
        style={[
          theme.typography.h2,
          { color: theme.colors.text, textAlign: 'center', marginBottom: 6 },
        ]}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.textMuted, textAlign: 'center', marginBottom: 16 },
          ]}
        >
          {description}
        </Text>
      ) : null}
      {actionTitle && onAction ? (
        <Button title={actionTitle} onPress={onAction} variant="secondary" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
});
