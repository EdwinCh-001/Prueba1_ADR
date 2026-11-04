import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { TextInput, View } from 'react-native';

import { useSession } from '../../context/session-context';
import {
  assessPasswordStrength,
  Card,
  Field,
  LogoPlate,
  PasswordStrengthIndicator,
  PrimaryButton,
  ShakeOnTrigger,
  Screen,
  inputClassName,
} from '../../components/ui';
import { Text } from '../../components/ui/text';
import { getAuthErrorMessage } from '../../services/auth-service';
import { registerFormSchema } from '../../types/schemas';
import type { RegisterForm } from '../../types/domain';

export default function SignUpScreen(): React.JSX.Element {
  const { register } = useSession();
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [passwordShake, setPasswordShake] = useState(0);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    defaultValues: {
      displayName: '',
      employeeCode: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
    resolver: zodResolver(registerFormSchema),
  });

  const submit = async (credentials: RegisterForm): Promise<void> => {
    setRegistrationError(null);
    setVerificationSent(false);
    if (assessPasswordStrength(credentials.password).level === 'weak') {
      setPasswordShake((trigger) => trigger + 1);
    }

    try {
      await register(credentials);
      setVerificationSent(true);
    } catch (error) {
      setRegistrationError(getAuthErrorMessage(error));
    }
  };

  const handleInvalidForm = (formErrors: FieldErrors<RegisterForm>): void => {
    if (formErrors.password) {
      setPasswordShake((trigger) => trigger + 1);
    }
  };

  return (
    <Screen contentContainerClassName="justify-center">
      <View className="items-center gap-3 px-3">
        <LogoPlate size="lg" align="center" />
        <Text className="text-3xl font-extrabold text-content" variant="title">
          Crear cuenta
        </Text>
        <Text className="text-center text-sm text-content-muted" variant="subtitle">
          Verificaremos tu correo antes de habilitar el acceso.
        </Text>
      </View>

      <Card className="gap-5" elevated>
        {verificationSent ? (
          <View className="gap-2 rounded-2xl bg-success-soft p-4">
            <Text className="text-base font-bold text-success">Revisa tu correo</Text>
            <Text className="text-sm text-content" variant="subtitle">
              Enviamos un enlace de verificación. Confirma tu cuenta antes de iniciar sesión.
            </Text>
          </View>
        ) : (
          <>
            <Field label="Nombre de usuario" error={errors.displayName?.message}>
              <Controller
                control={control}
                name="displayName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    autoCapitalize="words"
                    autoCorrect={false}
                    className={inputClassName}
                    maxLength={80}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Ej. María Pérez"
                    placeholderTextColorClassName="accent-content-subtle"
                    returnKeyType="next"
                    textContentType="name"
                    value={value}
                  />
                )}
              />
            </Field>

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
                    maxLength={30}
                    placeholder="TEC001"
                    placeholderTextColorClassName="accent-content-subtle"
                    value={value}
                  />
                )}
              />
            </Field>

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
                    onChangeText={onChange}
                    placeholder="tecnico@epmaps.gob.ec"
                    placeholderTextColorClassName="accent-content-subtle"
                    textContentType="emailAddress"
                    value={value}
                  />
                )}
              />
            </Field>

            <Field label="Contraseña" error={errors.password?.message}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <ShakeOnTrigger trigger={passwordShake}>
                    <View className="gap-2">
                      <TextInput
                        autoCapitalize="none"
                        className={inputClassName}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Mínimo 6 caracteres"
                        placeholderTextColorClassName="accent-content-subtle"
                        secureTextEntry
                        textContentType="newPassword"
                        value={value}
                      />
                      <PasswordStrengthIndicator password={value} />
                    </View>
                  </ShakeOnTrigger>
                )}
              />
            </Field>

            <Field label="Confirmar contraseña" error={errors.confirmPassword?.message}>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    autoCapitalize="none"
                    className={inputClassName}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Repite la contraseña"
                    placeholderTextColorClassName="accent-content-subtle"
                    secureTextEntry
                    textContentType="newPassword"
                    value={value}
                  />
                )}
              />
            </Field>

            {registrationError ? (
              <View className="rounded-2xl bg-danger-soft p-3">
                <Text className="text-sm text-danger">{registrationError}</Text>
              </View>
            ) : null}

            <PrimaryButton
              disabled={isSubmitting}
              label={isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
              onPress={handleSubmit(submit, handleInvalidForm)}
            />
          </>
        )}

        <View className="flex-row flex-wrap justify-center gap-1">
          <Text className="text-sm text-content-muted">¿Ya tienes una cuenta?</Text>
          <Link href="/login">
            <Text className="text-sm font-bold text-brand-light">Inicia sesión</Text>
          </Link>
        </View>
      </Card>
    </Screen>
  );
}
