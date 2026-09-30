import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors, spacing, type, radius } from '../theme/tokens';
import PrimaryButton from '../components/PrimaryButton';
import { useFavourites } from '../context/FavouritesContext';

export default function DressDetailScreen({ route, navigation }) {
  const { dress } = route.params;
  const { isFavourite } = useFavourites();
  const saved = isFavourite(dress.id);

  return (
    <View style={styles.flex}>
      <ScrollView bounces={false}>
        <Image source={{ uri: dress.image }} style={styles.image} />

        <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={type.h1}>{dress.name}</Text>
            {saved && (
              <View style={styles.savedPill}>
                <Text style={styles.savedPillText}>Saved</Text>
              </View>
            )}
          </View>
          <Text style={[type.label, styles.meta]}>Size {dress.size} · Uploaded by {dress.uploader}</Text>
          <Text style={[type.body, styles.description]}>{dress.description}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Try it on" onPress={() => navigation.navigate('TryOn', { dress })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bone },
  image: { width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.clayLight },
  backButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.md,
    backgroundColor: 'rgba(20,23,28,0.55)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  backText: { color: colors.bone, fontFamily: type.bodyMedium?.fontFamily },
  content: { padding: spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  meta: { marginTop: spacing.xs },
  description: { marginTop: spacing.md },
  savedPill: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  savedPillText: { fontFamily: type.bodySemiBold?.fontFamily, fontSize: 12, color: colors.ink },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.clayLight,
    backgroundColor: colors.bone,
  },
});
