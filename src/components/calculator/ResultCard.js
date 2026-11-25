import { useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy, Share2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Button, Card } from '../ui';

export function ResultCard({
  title = 'Result',
  primaryLabel,
  primaryValue,
  badgeText = '',
  badgeColor = '',
  rows = [],
  shareText = '',
  disclaimer = '',
}) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);

  const buildSummaryText = () => {
    if (shareText) return shareText;
    const lines = [`${title}: ${primaryLabel ? `${primaryLabel} = ` : ''}${primaryValue}`];
    for (const row of rows) {
      lines.push(`${row.label}: ${row.value}`);
    }
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(buildSummaryText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failure on unsupported platforms
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${buildSummaryText()}\n\nCalculated with One Calculator`,
      });
    } catch {
      // User cancelled or share unavailable
    }
  };

  return (
    <Card style={styles.card}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>
          {title.toUpperCase()}
        </Text>
        {badgeText ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: `${badgeColor || theme.colors.primary}20`,
                borderRadius: theme.radii.full,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.small,
                { color: badgeColor || theme.colors.primary, fontWeight: '700' },
              ]}
            >
              {badgeText}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.primaryBox}>
        {primaryLabel ? (
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            {primaryLabel}
          </Text>
        ) : null}
        <Text
          selectable
          style={[
            theme.typography.hero,
            { color: theme.colors.primary, marginTop: 4 },
          ]}
        >
          {primaryValue}
        </Text>
      </View>

      {rows.length > 0 ? (
        <View style={[styles.rowsBox, { borderTopColor: theme.colors.border }]}>
          {rows.map((row, idx) => (
            <View key={`${row.label}-${idx}`} style={styles.row}>
              <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
                {row.label}
              </Text>
              <Text
                selectable
                style={[
                  theme.typography.bodyMedium,
                  {
                    color: row.color || theme.colors.text,
                    fontWeight: '600',
                  },
                ]}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          title={copied ? 'Copied' : 'Copy'}
          variant="secondary"
          onPress={handleCopy}
          style={styles.actionBtn}
          icon={
            copied ? (
              <Check size={16} color={theme.colors.success} />
            ) : (
              <Copy size={16} color={theme.colors.text} />
            )
          }
        />
        <Button
          title="Share"
          variant="outline"
          onPress={handleShare}
          style={styles.actionBtn}
          icon={<Share2 size={16} color={theme.colors.text} />}
        />
      </View>

      {disclaimer ? (
        <View
          style={[
            styles.disclaimer,
            {
              backgroundColor: theme.colors.warningSoft,
              borderRadius: theme.radii.sm,
            },
          ]}
        >
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            {disclaimer}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  primaryBox: {
    paddingVertical: 14,
  },
  rowsBox: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
  },
  disclaimer: {
    marginTop: 14,
    padding: 10,
  },
});
