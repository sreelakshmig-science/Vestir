import React from 'react';
import { View, Text, Image, FlatList, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, type, radius } from '../theme/tokens';
import { useFavourites } from '../context/FavouritesContext';

function formatSavedAt(timestamp) {
  const diffMinutes = Math.round((Date.now() - timestamp) / 60000);
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function FavouritesScreen({ navigation }) {
  const { favourites, removeFavourite } = useFavourites();

  if (favourites.length === 0) {
    return (
      <View style={[styles.flex, styles.empty]}>
        <Text style={type.h2}>Nothing saved yet</Text>
        <Text style={[type.body, styles.emptyBody]}>
          Try something on and tap Save - it'll show up here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <Text style={[type.h2, styles.header]}>Favourites</Text>
      <FlatList
        data={favourites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('DressDetail', { dress: item })}
          >
            <Image source={{ uri: item.image }} style={styles.thumb} />
            <View style={styles.rowInfo}>
              <Text style={type.dressName} numberOfLines={1}>{item.name}</Text>
              <Text style={type.caption}>Size {item.size} · {formatSavedAt(item.savedAt)}</Text>
            </View>
            <Pressable onPress={() => removeFavourite(item.id)} hitSlop={10} style={styles.removeButton}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bone },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  thumb: { width: 56, height: 72, borderRadius: radius.sm, backgroundColor: colors.clayLight },
  rowInfo: { flex: 1, marginLeft: spacing.md },
  removeButton: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  removeText: { ...type.caption, color: colors.error },
  empty: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyBody: { textAlign: 'center', marginTop: spacing.xs, color: colors.clay },
});
