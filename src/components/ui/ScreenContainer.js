import { ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function ScreenContainer({
  children,
  scroll = true,
  style,
  contentContainerStyle,
}) {
  const { theme } = useTheme();

  if (!scroll) {
    return (
      <View
        style={[
          styles.base,
          { backgroundColor: theme.colors.background },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.base, { backgroundColor: theme.colors.background }, style]}
      contentContainerStyle={[
        { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});
