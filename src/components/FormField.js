import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radius, spacing, type } from '../theme/tokens';

export default function FormField({ label, error, style, ...inputProps }) {
  return (
    <View style={[styles.wrap, style]}>
      <Text style={type.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={colors.clay}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  input: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.clayLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontFamily: type.body.fontFamily,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.card,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    marginTop: spacing.xs,
    fontFamily: type.caption.fontFamily,
    fontSize: 12,
    color: colors.error,
  },
});
