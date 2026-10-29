import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { useSession } from '../../context/session-context';
import { loginFormSchema } from '../../types/schemas';
import type { LoginForm } from '../../types/domain';
import {
  AccentBar,
  Card,
  Field,
  LogoPlate,
  PrimaryButton,
  Screen,
  StatusChip,
  inputClassName,
} from '../../components/ui';

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
    <Screen contentContainerClassName="justify-center">
      <View className="items-center gap-3 pb-2">
        <LogoPlate size="lg" align="center" />
        <Text className="text-xs font-bold uppercase tracking-widest text-brand-light">
          Aplicación oficial para técnicos
        </Text>
        <Text className="text-3xl font-extrabold uppercase tracking-wide text-content">
          Bienvenido
        </Text>
        <Text className="text-center text-base text-content-muted">
          Ingresa para comenzar tu jornada.
        </Text>
      </View>

      <Card className="gap-5">
        <Field label="Código de empleado" error={errors.employeeCode?.message}>
          <Controller
            control={control}
            name="employeeCode"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                autoCapitalize="characters"
                autoCorrect={false}
                className={inputClassName}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="TEC001"
                placeholderTextColorClassName="accent-content-subtle"
                value={value}
              />
            )}
          />
        </Field>

        <Field label="Clave" error={errors.password?.message}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={inputClassName}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="••••"
                placeholderTextColorClassName="accent-content-subtle"
                secureTextEntry
                value={value}
              />
            )}
          />
        </Field>

        {authenticationError ? (
          <View className="rounded-2xl bg-danger-soft p-3">
            <Text className="text-sm text-danger">{authenticationError}</Text>
          </View>
        ) : null}

        <PrimaryButton
          disabled={isSubmitting}
          label={isSubmitting ? 'Ingresando...' : 'Iniciar jornada'}
          onPress={handleSubmit(submit)}
        />
      </Card>

      <StatusChip label="Demo: TEC001 / 1234" tone="neutral" />

      <View className="items-center gap-3 pt-2">
        <AccentBar className="w-16" />
        <Text className="text-xs text-content-subtle">EPMAPS · Agua de Quito</Text>
      </View>
    </Screen>
  );
}
