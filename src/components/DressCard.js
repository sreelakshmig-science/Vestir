import React from 'react';
import { Pressable, View, Image, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, type } from '../theme/tokens';

export default function DressCard({ dress, onPress, style }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}>
      <Image source={{ uri: dress.image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={type.dressName} numberOfLines={1}>{dress.name}</Text>
        <Text style={styles.size}>Size {dress.size}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  pressed: { opacity: 0.9 },
  image: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.clayLight,
  },
  info: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  size: {
    ...type.caption,
    marginTop: 2,
  },
});
