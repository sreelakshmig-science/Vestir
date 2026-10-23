import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { colors, spacing, type } from '../theme/tokens';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import { login } from '../auth';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigation.replace('Home');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
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

        {error ? <Text style={styles.error}>{error}</Text> : null}
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
  error: { ...type.caption, color: colors.error, marginBottom: spacing.md },
  footer: { marginTop: spacing.lg, alignItems: 'center' },
  link: { color: colors.emerald, fontFamily: type.bodySemiBold?.fontFamily },
});
