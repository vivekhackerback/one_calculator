import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function roundToStep(val, step, min) {
  const steps = Math.round((val - min) / step);
  const next = min + steps * step;
  const decimals = String(step).includes('.')
    ? String(step).split('.')[1].length
    : 0;
  return Number(next.toFixed(decimals));
}

export function RangeSlider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  minLabel,
  maxLabel,
  accentColor,
}) {
  const { theme } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const trackWidthRef = useRef(0);
  const trackPageXRef = useRef(0);
  const trackRef = useRef(null);

  const numericValue = Number.isFinite(Number(value))
    ? clamp(Number(value), min, max)
    : min;
  const ratio = max > min ? (numericValue - min) / (max - min) : 0;

  const updateFromPageX = (pageX) => {
    const width = trackWidthRef.current;
    if (width <= 0) return;
    const localX = clamp(pageX - trackPageXRef.current, 0, width);
    const raw = min + (localX / width) * (max - min);
    const snapped = clamp(roundToStep(raw, step, min), min, max);
    if (onValueChange) {
      onValueChange(snapped);
    }
  };

  const handleGrant = (evt) => {
    setIsDragging(true);
    const pageX = evt.nativeEvent.pageX;
    if (trackRef.current?.measureInWindow) {
      trackRef.current.measureInWindow((x, _y, w) => {
        if (w > 0) {
          trackPageXRef.current = x;
          trackWidthRef.current = w;
        }
        updateFromPageX(pageX);
      });
    } else {
      updateFromPageX(pageX);
    }
  };

  const handleMove = (evt) => {
    updateFromPageX(evt.nativeEvent.pageX);
  };

  const handleRelease = () => {
    setIsDragging(false);
  };

  const activeColor = accentColor || theme.colors.primary;
  const thumbLeft = trackWidth > 0 ? ratio * trackWidth : 0;

  return (
    <View style={styles.container}>
      <View
        ref={trackRef}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) {
            trackWidthRef.current = w;
            setTrackWidth(w);
          }
        }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={handleGrant}
        onResponderMove={handleMove}
        onResponderRelease={handleRelease}
        onResponderTerminate={handleRelease}
        style={styles.touchArea}
      >
        <View
          style={[
            styles.trackBg,
            { backgroundColor: theme.colors.border },
          ]}
        >
          <View
            style={[
              styles.trackFill,
              {
                width: `${Math.round(ratio * 1000) / 10}%`,
                backgroundColor: activeColor,
              },
            ]}
          />
        </View>
        {trackWidth > 0 ? (
          <View
            pointerEvents="none"
            style={[
              styles.thumb,
              {
                left: thumbLeft - 11,
                backgroundColor: '#FFFFFF',
                borderColor: activeColor,
                transform: [{ scale: isDragging ? 1.15 : 1 }],
              },
            ]}
          />
        ) : null}
      </View>

      {minLabel || maxLabel ? (
        <View style={styles.boundsRow}>
          <Text style={[theme.typography.small, { color: theme.colors.textMuted }]}>
            {minLabel || ''}
          </Text>
          <Text style={[theme.typography.small, { color: theme.colors.textMuted }]}>
            {maxLabel || ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 2,
    marginBottom: 14,
  },
  touchArea: {
    height: 32,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBg: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 999,
  },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  boundsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
});
