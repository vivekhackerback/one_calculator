import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AppDataProvider } from '../context/AppDataContext';
import { PreferencesProvider } from '../context/PreferencesContext';

function RootNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="calculator/[id]"
          options={{
            headerShown: true,
            title: 'Calculator',
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PreferencesProvider>
          <AppDataProvider>
            <RootNavigator />
          </AppDataProvider>
        </PreferencesProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
