import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useSession } from '../../context/session-context';
import { loginFormSchema } from '../../types/schemas';
import type { LoginForm } from '../../types/domain';

export default function LoginScreen(): React.JSX.Element {
  const { signIn } = useSession();
  const [authenticationError, setAuthenticationError] = useState<string | null>(null);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    defaultValues: { employeeCode: '', password: '' },
    resolver: zodResolver(loginFormSchema),
  });

  const submit = async (credentials: LoginForm): Promise<void> => {
    setAuthenticationError(null);
    const authenticated = await signIn(credentials);
    if (!authenticated) {
      setAuthenticationError('El código o la clave no son correctos.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.brand}>
        <Image accessibilityLabel="Logo de EPMAPS Agua de Quito" resizeMode="contain" source={require('../../../assets/Logo.jpg')} style={styles.logo} />
        <View style={styles.brandAccent} />
        <Text style={styles.title}>Lecturas en campo</Text>
        <Text style={styles.subtitle}>Aplicación oficial para técnicos de EPMAPS</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bienvenido</Text>
        <Text style={styles.cardSubtitle}>Ingresa tus datos para iniciar la jornada.</Text>
        <Text style={styles.label}>Código de empleado</Text>
        <Controller
          control={control}
          name="employeeCode"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              autoCapitalize="characters"
              autoCorrect={false}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="TEC001"
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={value}
            />
          )}
        />
        {errors.employeeCode ? <Text style={styles.error}>{errors.employeeCode.message}</Text> : null}

        <Text style={styles.label}>Clave</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="••••"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              style={styles.input}
              value={value}
            />
          )}
        />
        {errors.password ? <Text style={styles.error}>{errors.password.message}</Text> : null}
        {authenticationError ? <Text style={styles.error}>{authenticationError}</Text> : null}

        <Pressable disabled={isSubmitting} onPress={handleSubmit(submit)} style={styles.button}>
          <Text style={styles.buttonText}>{isSubmitting ? 'Ingresando...' : 'Iniciar jornada'}</Text>
        </Pressable>
      </View>
      <Text style={styles.demo}>Acceso de demostración: TEC001 / 1234</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', marginBottom: 28 },
  brandAccent: { backgroundColor: '#10B981', borderRadius: 2, height: 4, marginTop: 4, width: 52 },
  button: { alignItems: 'center', backgroundColor: '#059669', borderRadius: 12, marginTop: 26, padding: 16 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 16, borderWidth: 1, elevation: 3, padding: 22, shadowColor: '#0F172A', shadowOffset: { height: 4, width: 0 }, shadowOpacity: 0.06, shadowRadius: 12 },
  cardSubtitle: { color: '#64748B', fontSize: 14, lineHeight: 20, marginTop: 6 },
  cardTitle: { color: '#0F172A', fontSize: 21, fontWeight: '800' },
  container: { backgroundColor: '#F8FAFC', flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 36 },
  demo: { color: '#64748B', fontSize: 13, marginTop: 20, textAlign: 'center' },
  error: { color: '#B42318', fontSize: 13, marginTop: 7 },
  input: { backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: 10, borderWidth: 1, color: '#0F172A', fontSize: 16, minHeight: 52, marginTop: 8, paddingHorizontal: 14 },
  label: { color: '#334155', fontSize: 14, fontWeight: '700', marginTop: 20 },
  logo: { height: 112, width: 220 },
  subtitle: { color: '#64748B', fontSize: 15, lineHeight: 22, marginTop: 10, textAlign: 'center' },
  title: { color: '#004B87', fontSize: 28, fontWeight: '800', marginTop: 12, textAlign: 'center' },
});
