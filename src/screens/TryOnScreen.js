import React, { useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, spacing, type, radius } from '../theme/tokens';
import PrimaryButton from '../components/PrimaryButton';
import { useFavourites } from '../context/FavouritesContext';

export default function TryOnScreen({ route, navigation }) {
  const { dress } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [saved, setSaved] = useState(false);
  const cameraRef = useRef(null);
  const { addFavourite } = useFavourites();

  if (!permission) {
    return <View style={styles.flex} />; // permissions still loading
  }

  if (!permission.granted) {
    return (
      <View style={[styles.flex, styles.center, styles.permissionWrap]}>
        <Text style={type.h2}>Camera access needed</Text>
        <Text style={[type.body, styles.permissionBody]}>
          Vestir needs your camera to show how {dress.name.toLowerCase()} looks on you.
        </Text>
        <PrimaryButton label="Allow camera access" onPress={requestPermission} style={styles.permissionButton} />
      </View>
    );
  }

  const handleSave = () => {
    // Later: could also upload the captured frame to the backend here.
    addFavourite(dress);
    setSaved(true);
  };

  return (
    <View style={styles.flex}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />

      {/* Garment overlay - a semi-transparent reference image the wearer
          lines themselves up against. A real try-on (body segmentation /
          AR mesh) would replace this with a ML-driven overlay later; this
          keeps the UI/UX honest about what's wired up today. */}
      <Image source={{ uri: dress.image }} style={styles.overlay} pointerEvents="none" />

      <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
        <Text style={styles.backText}>✕</Text>
      </Pressable>

      <View style={styles.bottomCard}>
        <Text style={styles.dressLabel}>{dress.name}</Text>
        <Text style={styles.dressMeta}>Size {dress.size}</Text>
        <PrimaryButton
          label={saved ? 'Saved to favourites ✓' : 'Save to favourites'}
          onPress={handleSave}
          variant={saved ? 'outline' : 'solid'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ink },
  center: { alignItems: 'center', justifyContent: 'center' },
  permissionWrap: { padding: spacing.lg },
  permissionBody: { textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg, color: colors.clay },
  permissionButton: { alignSelf: 'stretch' },
  overlay: {
    position: 'absolute',
    top: '12%',
    left: '20%',
    width: '60%',
    height: '55%',
    opacity: 0.45,
    resizeMode: 'contain',
  },
  backButton: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.md,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(20,23,28,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: colors.bone, fontSize: 16 },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bone,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
  dressLabel: { ...type.dressName },
  dressMeta: { ...type.caption, marginBottom: spacing.md },
});
