import React, { useCallback } from 'react';
import { View, Text, Image, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, type, radius } from '../theme/tokens';
import { useFavourites } from '../context/FavouritesContext';

export default function FavouritesScreen({ navigation }) {
  const { favourites, loading, error, refreshFavourites, removeFavourite } = useFavourites();

  useFocusEffect(useCallback(() => {
    refreshFavourites();
  }, [refreshFavourites]));

  if (loading && favourites.length === 0) {
    return (
      <View style={[styles.flex, styles.empty]}>
        <ActivityIndicator color={colors.emerald} />
        <Text style={[type.body, styles.emptyBody]}>Loading favourites...</Text>
      </View>
    );
  }

  if (favourites.length === 0) {
    return (
      <View style={[styles.flex, styles.empty]}>
        {error ? (
          <Text style={[type.body, styles.error]}>{error}</Text>
        ) : (
          <>
            <Text style={type.h2}>Nothing saved yet</Text>
            <Text style={[type.body, styles.emptyBody]}>
              Try something on and tap Save - it'll show up here.
            </Text>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <Text style={[type.h2, styles.header]}>Favourites</Text>
      {error ? <Text style={[type.body, styles.error]}>{error}</Text> : null}
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
              <Text style={type.caption}>Size {item.size}</Text>
            </View>
            <Pressable onPress={() => removeFavourite(item.favouriteId)} hitSlop={10} style={styles.removeButton}>
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
  error: { color: colors.error, textAlign: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.md },
});
