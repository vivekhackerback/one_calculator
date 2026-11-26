import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { usePreferences } from '../../context/PreferencesContext';

const ITEM_HEIGHT = 40;
const WHEEL_HEIGHT = ITEM_HEIGHT * 3;

const MONTHS = [
  { value: 1, label: '01' },
  { value: 2, label: '02' },
  { value: 3, label: '03' },
  { value: 4, label: '04' },
  { value: 5, label: '05' },
  { value: 6, label: '06' },
  { value: 7, label: '07' },
  { value: 8, label: '08' },
  { value: 9, label: '09' },
  { value: 10, label: '10' },
  { value: 11, label: '11' },
  { value: 12, label: '12' },
];

function getDaysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parseParts(isoStr, fallbackYear = 2000) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoStr || '');
  if (!match) {
    return { year: fallbackYear, month: 1, day: 1 };
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function formatParts(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const WheelColumn = memo(function WheelColumn({
  data,
  selectedValue,
  onSelect,
  theme,
  columnStyle,
}) {
  const scrollRef = useRef(null);
  const selectedIndex = Math.max(
    0,
    data.findIndex((item) => item.value === selectedValue)
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    }, 10);
    return () => clearTimeout(timer);
  }, [selectedIndex]);

  const handleScrollEnd = useCallback(
    (e) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      const idx = Math.max(
        0,
        Math.min(data.length - 1, Math.round(offsetY / ITEM_HEIGHT))
      );
      const item = data[idx];
      if (item && item.value !== selectedValue) {
        onSelect(item.value);
      }
    },
    [data, selectedValue, onSelect]
  );

  return (
    <View style={[styles.column, columnStyle]}>
      <ScrollView
        ref={scrollRef}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={(e) => {
          if (Math.abs(e.nativeEvent.velocity?.y || 0) < 0.05) {
            handleScrollEnd(e);
          }
        }}
        contentContainerStyle={styles.wheelContent}
      >
        {data.map((item, index) => {
          const isSelected = item.value === selectedValue;
          return (
            <Pressable
              key={item.value}
              onPress={() => {
                scrollRef.current?.scrollTo({
                  y: index * ITEM_HEIGHT,
                  animated: true,
                });
                if (item.value !== selectedValue) {
                  onSelect(item.value);
                }
              }}
              style={styles.wheelItem}
            >
              <Text
                style={[
                  styles.wheelItemText,
                  {
                    color: isSelected
                      ? theme.colors.primary
                      : theme.colors.textMuted,
                    fontWeight: isSelected ? '700' : '500',
                    fontSize: isSelected ? 17 : 15,
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

export function DateWheelPicker({
  label,
  value,
  onChange,
  minYear = 1900,
  maxYear = new Date().getFullYear(),
  helperText,
}) {
  const { theme } = useTheme();
  const { triggerHaptic } = usePreferences();

  const { year, month, day } = useMemo(
    () => parseParts(value, Math.min(2000, maxYear)),
    [value, maxYear]
  );

  const years = useMemo(() => {
    const list = [];
    for (let y = maxYear; y >= minYear; y -= 1) {
      list.push({ value: y, label: String(y) });
    }
    return list;
  }, [minYear, maxYear]);

  const maxDay = getDaysInMonth(year, month);
  const days = useMemo(() => {
    const list = [];
    for (let d = 1; d <= maxDay; d += 1) {
      list.push({ value: d, label: String(d).padStart(2, '0') });
    }
    return list;
  }, [maxDay]);

  const emitChange = useCallback(
    (nextYear, nextMonth, nextDay) => {
      triggerHaptic('selection');
      const clampedDay = Math.min(nextDay, getDaysInMonth(nextYear, nextMonth));
      onChange(formatParts(nextYear, nextMonth, clampedDay));
    },
    [onChange, triggerHaptic]
  );

  const formattedDisplay = useMemo(() => {
    return `${String(day).padStart(2, '0')} ${String(month).padStart(2, '0')} ${year}`;
  }, [day, month, year]);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[theme.typography.label, { color: theme.colors.text }]}>
          {label}
        </Text>
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.primary, fontWeight: '700' },
          ]}
        >
          {formattedDisplay}
        </Text>
      </View>

      <View
        style={[
          styles.wheelBox,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.lg,
          },
        ]}
      >
        <View
          pointerEvents="none"
          style={[
            styles.selectionBand,
            {
              backgroundColor: theme.colors.primarySoft,
              borderColor: theme.colors.primary,
            },
          ]}
        />

        <View style={styles.columnsRow}>
          <WheelColumn
            data={days}
            selectedValue={day}
            onSelect={(d) => emitChange(year, month, d)}
            theme={theme}
            columnStyle={styles.dayCol}
          />
          <WheelColumn
            data={MONTHS}
            selectedValue={month}
            onSelect={(m) => emitChange(year, m, day)}
            theme={theme}
            columnStyle={styles.monthCol}
          />
          <WheelColumn
            data={years}
            selectedValue={year}
            onSelect={(y) => emitChange(y, month, day)}
            theme={theme}
            columnStyle={styles.yearCol}
          />
        </View>
      </View>

      {helperText ? (
        <Text
          style={[
            theme.typography.small,
            { color: theme.colors.textMuted, marginTop: 6 },
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  wheelBox: {
    height: WHEEL_HEIGHT,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  selectionBand: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: ITEM_HEIGHT,
    height: ITEM_HEIGHT,
    borderRadius: 10,
    borderWidth: 1,
    opacity: 0.45,
  },
  columnsRow: {
    flex: 1,
    flexDirection: 'row',
  },
  column: {
    height: WHEEL_HEIGHT,
  },
  dayCol: {
    flex: 1,
  },
  monthCol: {
    flex: 1.2,
  },
  yearCol: {
    flex: 1.3,
  },
  wheelContent: {
    paddingVertical: ITEM_HEIGHT,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelItemText: {
    fontVariant: ['tabular-nums'],
  },
});
