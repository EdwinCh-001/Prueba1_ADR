import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
    <View style={styles.container}>
      <Text style={styles.eyebrow}>EPMAPS</Text>
      <Text style={styles.title}>Lecturas en campo</Text>
      <Text style={styles.subtitle}>Ingresa para comenzar tu jornada.</Text>

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
      <Text style={styles.demo}>Demo: TEC001 / 1234</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#0B6E69',
    borderRadius: 12,
    marginTop: 24,
    padding: 16,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  container: { flex: 1, justifyContent: 'center', padding: 28 },
  demo: { color: '#667085', marginTop: 20, textAlign: 'center' },
  error: { color: '#B42318', marginTop: 6 },
  eyebrow: { color: '#0B6E69', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
  input: { borderColor: '#D0D5DD', borderRadius: 10, borderWidth: 1, fontSize: 16, marginTop: 8, padding: 14 },
  label: { color: '#344054', fontWeight: '600', marginTop: 20 },
  subtitle: { color: '#667085', fontSize: 16, marginTop: 8 },
  title: { color: '#101828', fontSize: 30, fontWeight: '800', marginTop: 6 },
});
