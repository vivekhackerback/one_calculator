import { StyleSheet, Switch, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { Info, Palette, ShieldCheck, Sliders } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { usePreferences } from '../../context/PreferencesContext';
import {
  Card,
  CategoryChip,
  ScreenContainer,
  SegmentedControl,
} from '../../components/ui';

const THEME_OPTIONS = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const PRECISION_OPTIONS = [0, 1, 2, 3, 4, 5, 6];

export default function SettingsScreen() {
  const { theme } = useTheme();
  const {
    themeMode,
    decimalPrecision,
    hapticEnabled,
    setThemePreference,
    setDecimalPrecision,
    setHapticEnabled,
    triggerHaptic,
  } = usePreferences();

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <ScreenContainer>
      {/* Appearance */}
      <Text style={[theme.typography.label, styles.sectionTitle, { color: theme.colors.textMuted }]}>
        APPEARANCE
      </Text>
      <Card style={styles.card}>
        <View style={styles.rowHeader}>
          <Palette size={18} color={theme.colors.primary} />
          <Text style={[theme.typography.h3, { color: theme.colors.text, marginLeft: 8 }]}>
            Theme
          </Text>
        </View>
        <SegmentedControl
          options={THEME_OPTIONS}
          value={themeMode}
          onChange={(mode) => {
            triggerHaptic('selection');
            setThemePreference(mode);
          }}
        />
      </Card>

      {/* Calculation Preferences */}
      <Text style={[theme.typography.label, styles.sectionTitle, { color: theme.colors.textMuted }]}>
        PREFERENCES
      </Text>
      <Card style={styles.card}>
        <View style={styles.rowHeader}>
          <Sliders size={18} color={theme.colors.primary} />
          <Text style={[theme.typography.h3, { color: theme.colors.text, marginLeft: 8 }]}>
            Decimal Precision
          </Text>
        </View>
        <Text style={[theme.typography.caption, { color: theme.colors.textMuted, marginBottom: 10 }]}>
          Maximum decimal places shown in financial, business, and conversion results.
        </Text>
        <View style={styles.precisionRow}>
          {PRECISION_OPTIONS.map((p) => (
            <CategoryChip
              key={p}
              label={String(p)}
              selected={decimalPrecision === p}
              onPress={() => {
                triggerHaptic('selection');
                setDecimalPrecision(p);
              }}
            />
          ))}
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={[theme.typography.h3, { color: theme.colors.text }]}>
              Haptic Feedback
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textMuted, marginTop: 2 }]}>
              Subtle vibration on calculations and actions
            </Text>
          </View>
          <Switch
            value={hapticEnabled}
            onValueChange={(val) => {
              setHapticEnabled(val);
              if (val) triggerHaptic('selection');
            }}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </Card>

      {/* Privacy & About */}
      <Text style={[theme.typography.label, styles.sectionTitle, { color: theme.colors.textMuted }]}>
        PRIVACY & ABOUT
      </Text>
      <Card style={styles.card}>
        <View style={styles.rowHeader}>
          <ShieldCheck size={18} color={theme.colors.success} />
          <Text style={[theme.typography.h3, { color: theme.colors.text, marginLeft: 8 }]}>
            Offline-First Privacy
          </Text>
        </View>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
          One Calculator works 100% offline. No personal data, calculation history, or analytics leave your device. All favorites and history are stored locally in SQLite.
        </Text>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.rowHeader}>
          <Info size={18} color={theme.colors.primary} />
          <Text style={[theme.typography.h3, { color: theme.colors.text, marginLeft: 8 }]}>
            About One Calculator
          </Text>
        </View>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 10 }]}>
          All-in-one toolkit with 15 everyday, financial, business, unit conversion, and health calculators.
        </Text>
        <View style={styles.versionRow}>
          <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
            Application Version
          </Text>
          <Text style={[theme.typography.label, { color: theme.colors.text }]}>
            v{appVersion}
          </Text>
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: 8,
    marginTop: 6,
  },
  card: {
    marginBottom: 16,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  precisionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchInfo: {
    flex: 1,
    paddingRight: 12,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
