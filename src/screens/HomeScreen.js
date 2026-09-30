import React from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, type, radius } from '../theme/tokens';
import DressCard from '../components/DressCard';
import { useDresses } from '../context/DressesContext';

export default function HomeScreen({ navigation }) {
  const { dresses } = useDresses();

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
