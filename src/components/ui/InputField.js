import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export function InputField({
  label,
  value,
  onChangeText,
  placeholder = '',
  keyboardType = 'decimal-pad',
  prefix = '',
  suffix = '',
  error = '',
  helperText = '',
  editable = true,
  clearable = true,
  style,
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.wrapper, style]}>
      {label ? (
        <Text
          style={[
            theme.typography.label,
            { color: theme.colors.textSecondary, marginBottom: 6 },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: theme.colors.inputBg,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radii.md,
          },
        ]}
      >
        {prefix ? (
          <Text
            style={[
              theme.typography.bodyMedium,
              { color: theme.colors.textMuted, marginRight: 8 },
            ]}
          >
            {prefix}
          </Text>
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType={keyboardType}
          editable={editable}
          style={[
            styles.input,
            theme.typography.body,
            { color: theme.colors.text },
          ]}
        />

        {clearable && value && value.length > 0 && editable ? (
          <Pressable
            onPress={() => onChangeText('')}
            hitSlop={8}
            style={styles.clearBtn}
          >
            <X size={16} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}

        {suffix ? (
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textMuted, marginLeft: 8, fontWeight: '600' },
            ]}
          >
            {suffix}
          </Text>
        ) : null}
      </View>

      {error ? (
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.danger, marginTop: 4 },
          ]}
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textMuted, marginTop: 4 },
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
});
