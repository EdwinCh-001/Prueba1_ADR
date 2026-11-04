import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Image, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile } from 'firebase/auth';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

import {
  Card,
  Field,
  GhostButton,
  PrimaryButton,
  Screen,
  StaggeredEntrance,
  inputClassName,
} from '../../components/ui';
import { Text } from '../../components/ui/text';
import { useNotice } from '../../context/notice-context';
import { useSession } from '../../context/session-context';
import { useProfileQuery, profileQueryKey } from '../../hooks/use-profile-query';
import {
  saveUserProfile,
  type SaveProfileResult,
  type SelectedProfilePhoto,
} from '../../repositories/profile-repository';
import { auth } from '../../services/firebase';
import { userProfileSchema } from '../../types/schemas';
import type { UserProfile } from '../../types/domain';

interface SaveProfileRequest {
  values: UserProfile;
  photo: SelectedProfilePhoto | null;
}

const formLayout = Layout.duration(220);

const getSaveErrorMessage = (error: Error): string => {
  return error.message || 'No se pudo guardar el perfil en el dispositivo.';
};

export default function ProfileScreen(): React.JSX.Element {
  const { session } = useSession();
  const { showNotice, showToast } = useNotice();
  const queryClient = useQueryClient();
  const profileQuery = useProfileQuery();
  const [selectedPhoto, setSelectedPhoto] = useState<SelectedProfilePhoto | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const user = auth?.currentUser ?? null;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UserProfile>({
    defaultValues: { displayName: '', phoneNumber: '', photoPath: null },
    mode: 'onBlur',
    resolver: zodResolver(userProfileSchema),
  });

  useEffect(() => {
    if (profileQuery.data) {
      reset(profileQuery.data);
    }
  }, [profileQuery.data, reset]);

  const saveMutation = useMutation<SaveProfileResult, Error, SaveProfileRequest>({
    mutationFn: async ({ values, photo }) => {
      if (!user) {
        throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
      }

      await updateProfile(user, { displayName: values.displayName });
      await user.reload();

      return saveUserProfile(
        user.uid,
        session?.employeeCode ?? user.uid,
        values,
        photo,
      );
    },
    onSuccess: ({ profile, photoCleanupWarning }) => {
      if (user) {
        queryClient.setQueryData(profileQueryKey(user.uid), profile);
      }
      reset(profile);
      setSelectedPhoto(null);
      setPhotoError(null);
      showToast('Tu perfil se guardó correctamente.', 'success');
      if (photoCleanupWarning) {
        showNotice({
          title: 'Perfil guardado',
          message: `Se guardó la nueva foto, pero no se pudo borrar la anterior: ${photoCleanupWarning}`,
          tone: 'warning',
        });
      }
    },
  });

  const choosePhoto = async (): Promise<void> => {
    setPhotoError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showNotice({
          title: 'Permiso de fotos requerido',
          message: 'Permite el acceso a tus fotos para elegir una imagen de perfil.',
          tone: 'info',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedPhoto({ uri: asset.uri, mimeType: asset.mimeType ?? null });
      }
    } catch {
      setPhotoError('No se pudo abrir la galería. Inténtalo nuevamente.');
    }
  };

  const submit = (values: UserProfile): void => {
    saveMutation.mutate({ values, photo: selectedPhoto });
  };

  if (profileQuery.isPending) {
    return (
      <Screen contentContainerClassName="flex-1 justify-center">
        <ActivityIndicator colorClassName="accent-brand-light" size="large" />
        <Text className="text-center text-content-muted">Cargando tu perfil...</Text>
      </Screen>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <Screen contentContainerClassName="flex-1 justify-center">
        <Card className="gap-4">
          <Text className="text-lg font-bold text-content">No se pudo cargar el perfil</Text>
          <Text className="text-sm text-content-muted">
            No se pudo leer el perfil guardado localmente.
          </Text>
          <PrimaryButton label="Reintentar" onPress={() => void profileQuery.refetch()} />
          <GhostButton label="Volver" onPress={() => router.back()} />
        </Card>
      </Screen>
    );
  }

  const visiblePhoto = selectedPhoto?.uri ?? profileQuery.data.photoPath;
  const initials = profileQuery.data.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <Screen contentContainerClassName="pb-12">
      <Animated.View
        className="relative items-center gap-4 overflow-hidden rounded-[32px] bg-brand-dark px-5 py-7 shadow-lg shadow-brand-dark/20"
        entering={FadeInDown.duration(320)}
      >
        <View className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-brand/50" />
        <View className="absolute -bottom-16 -left-8 h-36 w-36 rounded-full border-[12px] border-white/10" />
        <View className="h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-brand">
          {visiblePhoto ? (
            <Image
              accessibilityLabel="Foto de perfil"
              className="h-full w-full"
              resizeMode="cover"
              source={{ uri: visiblePhoto }}
            />
          ) : (
            <Text className="text-4xl font-extrabold text-white">
              {initials || session?.employeeCode.slice(0, 2) || 'EP'}
            </Text>
          )}
        </View>
        <Text className="text-2xl font-extrabold text-white" variant="title">
          Tu perfil
        </Text>
        <Text className="text-center text-sm text-on-brand" variant="subtitle">
          Personaliza tu información de técnico
        </Text>
        <PrimaryButton label="Elegir foto de perfil" onPress={() => void choosePhoto()} />
      </Animated.View>

      <Animated.View layout={formLayout}>
        <Card className="gap-5" elevated>
          <StaggeredEntrance delayMs={100} className="w-full">
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
                    placeholder="Tu nombre"
                    placeholderTextColorClassName="accent-content-subtle"
                    returnKeyType="next"
                    value={value}
                  />
                )}
              />
            </Field>
          </StaggeredEntrance>

          <StaggeredEntrance delayMs={180} className="w-full">
            <Field label="Teléfono de contacto" error={errors.phoneNumber?.message}>
              <Controller
                control={control}
                name="phoneNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    autoComplete="tel"
                    autoCorrect={false}
                    className={inputClassName}
                    keyboardType="phone-pad"
                    maxLength={20}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="+593 99 123 4567"
                    placeholderTextColorClassName="accent-content-subtle"
                    value={value}
                  />
                )}
              />
            </Field>
            <Text className="mt-1 text-xs text-content-subtle" variant="subtitle">
              Usa un número móvil o fijo de Ecuador, con o sin el prefijo +593.
            </Text>
          </StaggeredEntrance>

          <View className="gap-3 rounded-2xl bg-surface-raised p-4">
            <Text className="text-xs font-bold text-content-subtle">
              Correo de la cuenta
            </Text>
            <Text className="text-base font-semibold text-content">
              {user?.email ?? 'No disponible'}
            </Text>
            <Text className="text-xs text-content-subtle" variant="subtitle">
              El correo se usa para iniciar sesión y requiere verificación para cambiarse.
            </Text>
          </View>

          <View className="gap-1">
            <Text className="text-xs font-bold text-content-subtle">
              Código de empleado
            </Text>
            <Text className="text-base font-semibold text-content">
              {session?.employeeCode ?? 'No disponible'}
            </Text>
          </View>

          {photoError || saveMutation.error ? (
            <View className="rounded-2xl bg-danger-soft p-3">
              <Text className="text-sm text-danger">
                {photoError ?? (saveMutation.error ? getSaveErrorMessage(saveMutation.error) : '')}
              </Text>
            </View>
          ) : null}

          <StaggeredEntrance delayMs={260} className="w-full">
            <PrimaryButton
              disabled={!isDirty && selectedPhoto === null}
              label={saveMutation.isPending ? 'Guardando perfil...' : 'Guardar cambios'}
              loading={saveMutation.isPending}
              onPress={handleSubmit(submit)}
            />
          </StaggeredEntrance>
          <GhostButton label="Volver al inicio" onPress={() => router.back()} />
        </Card>
      </Animated.View>
    </Screen>
  );
}
