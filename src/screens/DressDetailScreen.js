import React, { useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors, spacing, type, radius } from '../theme/tokens';
import PrimaryButton from '../components/PrimaryButton';
import { useFavourites } from '../context/FavouritesContext';

export default function DressDetailScreen({ route, navigation }) {
  const { dress } = route.params;
  const { favourites, addFavourite, removeFavourite, isFavourite } = useFavourites();
  const dressId = dress?._id;
  const favourite = favourites.find((item) => item._id === dressId);
  const saved = Boolean(dressId && isFavourite(dressId));
  const [saving, setSaving] = useState(false);
  const [favouriteError, setFavouriteError] = useState('');
  const requestInProgress = useRef(false);

  const handleFavouriteToggle = async () => {
    if (requestInProgress.current || saving) return;
    requestInProgress.current = true;
    setSaving(true);
    setFavouriteError('');

    try {
      if (saved) {
        if (!favourite?.favouriteId) {
          throw new Error('Could not find the saved favourite record. Refresh favourites and try again.');
        }
        const removed = await removeFavourite(favourite.favouriteId);
        if (!removed) throw new Error('Could not remove this favourite. Please try again.');
      } else {
        if (!dressId) throw new Error('Only dresses saved to the catalogue can be favourited.');
        await addFavourite(dress);
      }
    } catch (error) {
      setFavouriteError(error.message || 'Could not update this favourite. Please try again.');
    } finally {
      requestInProgress.current = false;
      setSaving(false);
    }
  };

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
          <Text style={[type.label, styles.meta]}>
            Size {dress.size}{dress.uploader ? ` · Uploaded by ${dress.uploader}` : ''}
          </Text>
          <Text style={[type.body, styles.description]}>{dress.description}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {favouriteError ? <Text style={styles.favouriteError}>{favouriteError}</Text> : null}
        <PrimaryButton
          label={saved ? 'Remove favourite' : 'Add favourite'}
          onPress={handleFavouriteToggle}
          loading={saving}
          variant="outline"
          style={styles.favouriteButton}
        />
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
  favouriteButton: { marginBottom: spacing.sm },
  favouriteError: { ...type.caption, color: colors.error, marginBottom: spacing.sm },
});
