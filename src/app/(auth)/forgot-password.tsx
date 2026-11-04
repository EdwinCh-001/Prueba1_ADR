import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextInput, View } from 'react-native';

import { Text } from '../../components/ui/text';
import { useSession } from '../../context/session-context';
import {
  Card,
  Field,
  LogoPlate,
  PrimaryButton,
  Screen,
  inputClassName,
} from '../../components/ui';
import { getAuthErrorMessage } from '../../services/auth-service';
import { passwordResetFormSchema } from '../../types/schemas';
import type { PasswordResetForm } from '../../types/domain';

export default function ForgotPasswordScreen(): React.JSX.Element {
  const { resetPassword } = useSession();
  const [requestError, setRequestError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<PasswordResetForm>({
    defaultValues: { email: '' },
    resolver: zodResolver(passwordResetFormSchema),
  });

  const submit = async (credentials: PasswordResetForm): Promise<void> => {
    setRequestError(null);
    setResetEmailSent(false);
    try {
      await resetPassword(credentials);
      setResetEmailSent(true);
    } catch (error) {
      setRequestError(getAuthErrorMessage(error));
    }
  };

  return (
    <Screen contentContainerClassName="justify-center">
      <View className="items-center gap-3">
        <LogoPlate size="lg" align="center" />
        <Text className="text-3xl font-extrabold text-content">
          Recuperar contraseña
        </Text>
        <Text className="text-center text-sm text-content-muted" variant="subtitle">
          Te enviaremos un enlace para crear una nueva contraseña.
        </Text>
      </View>

      <Card className="gap-5">
        <Field label="Correo electrónico" error={errors.email?.message}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                className={inputClassName}
                keyboardType="email-address"
                onBlur={onBlur}
                onChangeText={(text) => {
                  onChange(text);
                  setResetEmailSent(false);
                  setRequestError(null);
                }}
                placeholder="tecnico@epmaps.gob.ec"
                placeholderTextColorClassName="accent-content-subtle"
                textContentType="emailAddress"
                value={value}
              />
            )}
          />
        </Field>

        {resetEmailSent ? (
          <View className="rounded-2xl bg-success-soft p-3">
            <Text className="text-sm text-success">
              Si existe una cuenta asociada a este correo, recibirás instrucciones para recuperar el acceso.
            </Text>
          </View>
        ) : null}

        {requestError ? (
          <View className="rounded-2xl bg-danger-soft p-3">
            <Text className="text-sm text-danger">{requestError}</Text>
          </View>
        ) : null}

        <PrimaryButton
          disabled={isSubmitting}
          label={isSubmitting ? 'Enviando...' : 'Enviar instrucciones'}
          onPress={handleSubmit(submit)}
        />

        <Link href="/login" className="self-center">
          <Text className="text-sm font-bold text-brand-light">Volver a iniciar sesión</Text>
        </Link>
      </Card>
    </Screen>
  );
}
