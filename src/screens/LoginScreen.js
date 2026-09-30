import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { colors, spacing, type } from '../theme/tokens';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    // Later: call POST /api/auth/login on the Express backend here,
    // store the returned JWT, then navigate.
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('Home');
    }, 600);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>Vestir</Text>
        <Text style={type.h1}>Welcome back</Text>
        <Text style={[type.body, styles.subtitle]}>Log in to try on your saved pieces.</Text>

        <View style={styles.form}>
          <FormField
            label="Gmail"
            placeholder="you@gmail.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <FormField
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <PrimaryButton label="Log in" onPress={handleLogin} loading={loading} />

        <Pressable onPress={() => navigation.navigate('Signup')} style={styles.footer}>
          <Text style={type.body}>
            New here? <Text style={styles.link}>Create an account</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bone },
  container: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  brand: {
    ...type.h2,
    color: colors.emerald,
    marginBottom: spacing.xxl,
  },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.xl, color: colors.clay },
  form: { marginBottom: spacing.md },
  footer: { marginTop: spacing.lg, alignItems: 'center' },
  link: { color: colors.emerald, fontFamily: type.bodySemiBold?.fontFamily },
});
