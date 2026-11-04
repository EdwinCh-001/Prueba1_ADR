import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, TextInput, View } from 'react-native';

import { useSession } from '../../context/session-context';
import { getAuthErrorMessage } from '../../services/auth-service';
import { loginFormSchema } from '../../types/schemas';
import type { LoginForm } from '../../types/domain';
import {
  Card,
  Field,
  LogoPlate,
  PrimaryButton,
  ShakeOnTrigger,
  Screen,
  StaggeredEntrance,
  inputClassName,
} from '../../components/ui';
import { Text } from '../../components/ui/text';

export default function LoginScreen(): React.JSX.Element {
  const { authStateError, signIn } = useSession();
  const [authenticationError, setAuthenticationError] = useState<string | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginFormSchema),
  });

  const submit = async (credentials: LoginForm): Promise<void> => {
    setAuthenticationError(null);
    try {
      await signIn(credentials);
    } catch (error) {
      setAuthenticationError(getAuthErrorMessage(error));
      setShakeTrigger((trigger) => trigger + 1);
    }
  };

  return (
    <View className="flex-1 overflow-hidden bg-background">
      <Screen contentContainerClassName="justify-center pb-44">
        <StaggeredEntrance delayMs={0} className="items-center gap-3 pb-2">
          <LogoPlate size="lg" align="center" />
          <View className="flex-row items-center gap-2">
            <Text className="text-xs font-bold text-brand-light">
              PLATAFORMA OPERATIVA EPMAPS
            </Text>
          </View>
          <Text className="text-3xl font-extrabold text-content">
            Inicia sesión
          </Text>
        </StaggeredEntrance>

        <ShakeOnTrigger trigger={shakeTrigger} className="w-full">
          <Card className="gap-5">
            <StaggeredEntrance delayMs={90} className="w-full">
              <Field label="Correo electrónico" error={errors.email?.message}>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      className={inputClassName}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      keyboardType="email-address"
                      placeholder="tecnico@epmaps.gob.ec"
                      placeholderTextColorClassName="accent-content-subtle"
                      textContentType="emailAddress"
                      value={value}
                    />
                  )}
                />
              </Field>
            </StaggeredEntrance>

            <StaggeredEntrance delayMs={170} className="w-full">
              <Field label="Clave" error={errors.password?.message}>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      autoCapitalize="none"
                      className={inputClassName}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="••••"
                      placeholderTextColorClassName="accent-content-subtle"
                      secureTextEntry
                      textContentType="password"
                      value={value}
                    />
                  )}
                />
              </Field>
            </StaggeredEntrance>

            {authStateError || authenticationError ? (
              <StaggeredEntrance delayMs={230} className="w-full">
                <View className="rounded-2xl bg-danger-soft p-3">
                  <Text className="text-sm text-danger">
                    {authenticationError ?? authStateError}
                  </Text>
                </View>
              </StaggeredEntrance>
            ) : null}

            <StaggeredEntrance delayMs={280} className="w-full">
              <PrimaryButton
                disabled={isSubmitting}
                label={isSubmitting ? 'Ingresando...' : 'Iniciar jornada'}
                onPress={handleSubmit(submit)}
              />
            </StaggeredEntrance>

            <StaggeredEntrance delayMs={360} className="self-end">
              <Link href="/forgot-password">
                <Text className="text-sm font-bold text-brand-light">¿Olvidaste tu contraseña?</Text>
              </Link>
            </StaggeredEntrance>
          </Card>
        </ShakeOnTrigger>

        <StaggeredEntrance delayMs={440} className="flex-row flex-wrap justify-center gap-1">
          <Text className="text-sm text-content-muted">¿No tienes una cuenta?</Text>
          <Link href="/sign-up">
            <Text className="text-sm font-bold text-brand-light">Regístrate</Text>
          </Link>
        </StaggeredEntrance>
      </Screen>

      <View className="pointer-events-none absolute bottom-0 left-0 right-0 h-52 w-full">
        <Image
          accessible={false}
          className="h-full w-full"
          resizeMode="cover"
          source={require('../../../assets/fondo_bottom.png')}
        />
      </View>
    </View>
  );
}
