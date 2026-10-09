import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, type, radius } from '../theme/tokens';
import DressCard from '../components/DressCard';
import { useDresses } from '../context/DressesContext';

export default function HomeScreen({ navigation }) {
  const { dresses } = useDresses();

  const handleCreate3D = () => {
    if (typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png,image/jpeg,image/webp,image/jpg';
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          const rawName = file.name.replace(/\.[^/.]+$/, '').trim();
          navigation.navigate('TryOn', {
            dress: {
              id: `custom-${Date.now()}`,
              name: rawName || 'Custom Garment',
              size: 'Custom',
              uploader: 'You',
              description: 'AI Generated 3D Garment from Hunyuan3D',
            },
            initialImageFile: file,
          });
        }
      };
      input.click();
    } else {
      navigation.navigate('TryOn', {
        dress: {
          id: `custom-${Date.now()}`,
          name: 'Custom 3D Garment',
          size: 'Custom',
        },
      });
    }
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Vestir</Text>
          <Text style={type.caption}>{dresses.length} pieces to try on</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Instructions')} hitSlop={10}>
          <Text style={styles.helpLink}>How it works</Text>
        </Pressable>
      </View>

      <FlatList
        data={dresses}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        ListHeaderComponent={
          <Pressable style={styles.aiBanner} onPress={handleCreate3D}>
            <View style={styles.aiBadgeRow}>
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>Virtual 3D TRY-ON</Text>
              </View>
              <Text style={styles.aiBadgeSparkle}></Text>
            </View>
            <Text style={styles.aiBannerTitle}>Create 3D Try-On from Photo</Text>
            <Text style={styles.aiBannerSubtitle}>

            </Text>
            <View style={styles.aiBannerButton}>
              <Text style={styles.aiBannerButtonText}>Upload Garment Photo →</Text>
            </View>
          </Pressable>
        }
        renderItem={({ item }) => (
          <DressCard
            dress={item}
            style={styles.cardHalf}
            onPress={() => navigation.navigate('DressDetail', { dress: item })}
          />
        )}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('UploadDress')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bone },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  brand: { ...type.h2, color: colors.emerald },
  helpLink: { ...type.label, textDecorationLine: 'underline' },
  grid: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  row: { justifyContent: 'space-between' },
  cardHalf: { width: '48%' },
  aiBanner: {
    marginBottom: spacing.lg,
    backgroundColor: '#1E2D24',
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.ink,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  aiBadge: {
    backgroundColor: colors.emerald,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
  },
  aiBadgeText: {
    fontFamily: type.bodySemiBold?.fontFamily,
    fontSize: 11,
    color: colors.bone,
    letterSpacing: 0.5,
  },
  aiBadgeSparkle: {
    ...type.caption,
    color: '#85D4B2',
    fontSize: 12,
  },
  aiBannerTitle: {
    ...type.h2,
    color: colors.bone,
    marginTop: spacing.xs,
  },
  aiBannerSubtitle: {
    ...type.caption,
    color: '#B5C4BC',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  aiBannerButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    backgroundColor: colors.emerald,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  aiBannerButtonText: {
    ...type.label,
    color: colors.bone,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.ink,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: colors.bone, fontSize: 28, lineHeight: 30, fontFamily: type.bodySemiBold?.fontFamily },
});
