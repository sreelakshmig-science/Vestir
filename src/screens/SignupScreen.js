import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { colors, spacing, type } from '../theme/tokens';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';

export default function SignupScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Enter your name';
    if (!/^\S+@gmail\.com$/.test(form.email.trim())) next.email = 'Enter a valid Gmail address';
    if (form.password.length < 6) next.password = 'At least 6 characters';
    if (form.confirm !== form.password) next.confirm = "Passwords don't match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSignup = () => {
    if (!validate()) return;
    // Later: POST /api/auth/signup with { name, email, password }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('Instructions');
    }, 600);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={type.h1}>Create your account</Text>
        <Text style={[type.body, styles.subtitle]}>Save pieces and try them on before you buy.</Text>

        <View style={styles.form}>
          <FormField label="Name" placeholder="Full name" value={form.name} onChangeText={update('name')} error={errors.name} />
          <FormField
            label="Gmail"
            placeholder="you@gmail.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={update('email')}
            error={errors.email}
          />
          <FormField label="Password" placeholder="••••••••" secureTextEntry value={form.password} onChangeText={update('password')} error={errors.password} />
          <FormField label="Confirm password" placeholder="••••••••" secureTextEntry value={form.confirm} onChangeText={update('confirm')} error={errors.confirm} />
        </View>

        <PrimaryButton label="Sign up" onPress={handleSignup} loading={loading} />

        <Pressable onPress={() => navigation.goBack()} style={styles.footer}>
          <Text style={type.body}>
            Already have an account? <Text style={styles.link}>Log in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bone },
  container: { flexGrow: 1, padding: spacing.lg, justifyContent: 'center' },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.xl, color: colors.clay },
  form: { marginBottom: spacing.md },
  footer: { marginTop: spacing.lg, alignItems: 'center' },
  link: { color: colors.emerald },
});
