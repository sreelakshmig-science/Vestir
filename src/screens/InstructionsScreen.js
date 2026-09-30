import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, type, radius } from '../theme/tokens';
import PrimaryButton from '../components/PrimaryButton';

const STEPS = [
  {
    title: 'Browse the collection',
    body: 'Every piece on Home was uploaded by another user, with a name, size and short description.',
  },
  {
    title: 'Open a piece you like',
    body: 'Tap any photo to read its full description before deciding to try it on.',
  },
  {
    title: 'Try it on',
    body: 'Tap Try-On to open your camera. Line yourself up with the garment overlay and hold still.',
  },
  {
    title: 'Save what you love',
    body: 'Tap Save on the try-on screen to add it to Favourites - it stays there in the order you saved it.',
  },
];

export default function InstructionsScreen({ navigation }) {
  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={type.h1}>How Vestir works</Text>
        <Text style={[type.body, styles.subtitle]}>Four steps, camera to closet.</Text>

        {STEPS.map((step, i) => (
          <View key={step.title} style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{i + 1}</Text>
            </View>
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={type.body}>{step.body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label="Got it, take me in" onPress={() => navigation.replace('Home')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bone },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.xl, color: colors.clay },
  step: { flexDirection: 'row', marginBottom: spacing.lg },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: { color: colors.bone, fontFamily: type.bodySemiBold?.fontFamily, fontSize: 14 },
  stepText: { flex: 1 },
  stepTitle: { ...type.dressName, marginBottom: 4 },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.clayLight,
    backgroundColor: colors.bone,
  },
});
