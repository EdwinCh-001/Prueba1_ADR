import { router } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Image, Keyboard, Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnUI } from 'react-native-worklets';

import { useSession } from '../../context/session-context';
import { useNotice } from '../../context/notice-context';
import { useReading } from '../../context/reading-context';
import { deleteDraft, findDraftByEmployee } from '../../repositories/draft-repository';
import { deleteStoredPhoto } from '../../services/photo-storage';
import { findCachedMeter } from '../../repositories/meter-cache-repository';
import { useMeterQuery } from '../../hooks/use-meter-query';
import { useMeterLocationQuery } from '../../hooks/use-meter-location-query';
import { useProfileQuery } from '../../hooks/use-profile-query';
import { useConnectivity, usePendingCount } from '../../providers/sync-provider';
import {
  hasMeaningfulDraftData,
  meterCodeSchema,
  registrationDraftPayloadSchema,
} from '../../types/schemas';
import {
  Badge,
  Card,
  GhostButton,
  KeyValueRow,
  ListRow,
  LocationMap,
  LogoPlate,
  PrimaryButton,
  Screen,
  SectionTitle,
  StatsRow,
  StatusChip,
  inputClassName,
  LottieState,
} from '../../components/ui';
import { Text } from '../../components/ui/text';
import loadingMeterAnimation from '../../../assets/animations/loading-meter.json';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const flipAvatar = (rotation: SharedValue<number>, target: number): void => {
  'worklet';
  rotation.value = withTiming(target, {
    duration: 360,
    easing: Easing.inOut(Easing.cubic),
  });
};

const HomeHeader = memo(function HomeHeader({
  displayName,
  photoPath,
  initials,
  employeeCode,
}: {
  displayName: string;
  photoPath: string | null;
  initials: string;
  employeeCode: string;
}): React.JSX.Element {
  const rotation = useSharedValue(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const photoFaceStyle = useAnimatedStyle(() => ({
    opacity: interpolate(rotation.value, [0, 0.4, 0.6, 1], [1, 1, 0, 0]),
    transform: [
      { perspective: 700 },
      { rotateY: `${interpolate(rotation.value, [0, 1], [0, 90])}deg` },
    ],
  }));
  const employeeCodeFaceStyle = useAnimatedStyle(() => ({
    opacity: interpolate(rotation.value, [0, 0.4, 0.6, 1], [0, 0, 1, 1]),
    transform: [
      { perspective: 700 },
      { rotateY: `${interpolate(rotation.value, [0, 1], [-90, 0])}deg` },
    ],
  }));

  return (
    <Animated.View
      className="relative overflow-hidden rounded-[32px] bg-brand-dark p-5"
      entering={FadeIn.duration(320)}
    >
      <View className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand" />
      <View className="absolute -bottom-12 right-10 h-20 w-20 rounded-full bg-brand-light/50" />
      <View className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full border-[14px] border-white/5" />
      <View className="relative">
        <LogoPlate size="sm" tone="white" />
      </View>
      <View className="relative flex-row items-center justify-between gap-4">
        <Text className="flex-1 text-3xl font-extrabold text-white">
          Hola, {displayName}
        </Text>
        <AnimatedPressable
          accessibilityHint="Toca para voltear la tarjeta y ver el código de empleado."
          accessibilityLabel={isFlipped ? `Código de empleado ${employeeCode}` : 'Foto de perfil. Toca para ver tu código de empleado.'}
          accessibilityRole="button"
          accessibilityState={{ expanded: isFlipped }}
          className="-mt-3 h-24 w-24"
          onPress={() => {
            const nextFlipped = !isFlipped;
            setIsFlipped(nextFlipped);
            scheduleOnUI(flipAvatar, rotation, nextFlipped ? 1 : 0);
          }}
        >
          <Animated.View
            className="absolute inset-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white/15"
            style={photoFaceStyle}
          >
            {photoPath ? (
              <Image className="h-full w-full" resizeMode="cover" source={{ uri: photoPath }} />
            ) : (
              <Text className="text-2xl font-extrabold text-white">{initials}</Text>
            )}
          </Animated.View>
          <Animated.View
            className="absolute inset-0 items-center justify-center rounded-full border-2 border-white bg-brand px-1"
            style={employeeCodeFaceStyle}
          >
            <Text className="text-center text-[14px] font-bold text-white" numberOfLines={1}>
              Código
            </Text>
            <Text className="text-center text-[14px] font-extrabold text-white" numberOfLines={2}>
              {employeeCode}
            </Text>
          </Animated.View>
        </AnimatedPressable>
      </View>
      <Text className="relative mt-2 text-sm font-semibold text-on-brand" variant="subtitle">
        Control de lecturas en campo
      </Text>
    </Animated.View>
  );
});

export default function HomeScreen(): React.JSX.Element {
  const { session, signOut } = useSession();
  const { showNotice } = useNotice();
  const { setForm, setMeter } = useReading();
  const { isConnected } = useConnectivity();
  const { pendingCount } = usePendingCount();
  const profileQuery = useProfileQuery();
  const profileName = profileQuery.data?.displayName || session?.employeeCode || '';
  const [meterCode, setMeterCode] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const meterResultOffset = useRef(0);
  const pendingMeterScroll = useRef(false);
  const { control, getValues, handleSubmit, formState: { errors } } = useForm<{ code: string }>({
    defaultValues: { code: '' },
  });
  const meterQuery = useMeterQuery(meterCode);
  const visibleMeter = meterQuery.data?.code === meterCode ? meterQuery.data : null;
  const meterLocationQuery = useMeterLocationQuery(visibleMeter?.code ?? '');
  const initials = useMemo(
    () => profileName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join(''),
    [profileName],
  );
  const today = useMemo(
    () => new Date().toLocaleDateString('es-EC', { day: 'numeric', month: 'short' }),
    [],
  );

  useEffect(() => {
    if (!session) {
      return;
    }

    let isActive = true;
    const discardDraft = async (photoPath: string | null, message?: string): Promise<void> => {
      try {
        await deleteDraft(session.employeeCode);
        await deleteStoredPhoto(photoPath);
        if (message && isActive) {
          showNotice({ title: 'Borrador descartado', message, tone: 'success' });
        }
      } catch {
        if (isActive) {
          showNotice({ title: 'Error', message: 'No se pudo eliminar el borrador guardado.', tone: 'danger' });
        }
      }
    };

    const restoreDraft = async (payloadJson: string, photoPath: string | null): Promise<void> => {
      try {
        const parsedPayload = registrationDraftPayloadSchema.safeParse(
          JSON.parse(payloadJson) as unknown,
        );
        if (!parsedPayload.success || !hasMeaningfulDraftData(parsedPayload.data.form)) {
          await discardDraft(
            photoPath,
            'El registro guardado estaba incompleto y se eliminó.',
          );
          return;
        }

        const { meter, form } = parsedPayload.data;
        const cachedMeter = await findCachedMeter(meter.code);
        if (!isActive) {
          return;
        }
        setMeter(cachedMeter ?? meter);
        setForm(form);
        router.push('/register');
      } catch {
        await discardDraft(
          photoPath,
          'El registro guardado no pudo recuperarse y se eliminó.',
        );
      }
    };

    const checkDraft = async (): Promise<void> => {
      try {
        const draft = await findDraftByEmployee(session.employeeCode);
        if (!isActive || !draft) {
          return;
        }

        let payloadJson: unknown;
        try {
          payloadJson = JSON.parse(draft.payloadJson) as unknown;
        } catch {
          await discardDraft(
            draft.photoPath,
            'El registro guardado no tenía un formato válido y se eliminó.',
          );
          return;
        }
        const parsedPayload = registrationDraftPayloadSchema.safeParse(payloadJson);
        if (!parsedPayload.success || !hasMeaningfulDraftData(parsedPayload.data.form)) {
          await discardDraft(
            draft.photoPath,
            'El registro guardado estaba incompleto y se eliminó.',
          );
          return;
        }

        showNotice({
          title: 'Registro pendiente',
          message: '¿Deseas continuar el registro guardado?',
          tone: 'info',
          actions: [
            { label: 'Descartar', destructive: true, onPress: () => void discardDraft(draft.photoPath) },
            { label: 'Continuar', onPress: () => void restoreDraft(draft.payloadJson, draft.photoPath) },
          ],
        });
      } catch {
        if (isActive) {
          showNotice({ title: 'Error', message: 'No se pudo revisar el registro guardado.', tone: 'danger' });
        }
      }
    };

    void checkDraft();
    return () => {
      isActive = false;
    };
  }, [session, setForm, setMeter, showNotice]);

  const handleSignOut = async (): Promise<void> => {
    await signOut();
    router.replace('/login');
  };

  const submitMeterCode = useCallback(({ code }: { code: string }): void => {
    const parsedCode = meterCodeSchema.safeParse(code.trim());
    if (parsedCode.success) {
      setMeterCode(parsedCode.data);
      return;
    }

    setMeterCode('');
  }, []);

  const scrollToMeterResult = useCallback((): void => {
    scrollViewRef.current?.scrollTo({
      y: Math.max(0, meterResultOffset.current - 20),
      animated: false,
    });
  }, []);

  const handleMeterCardLayout = useCallback((): void => {
    if (!pendingMeterScroll.current) {
      return;
    }

    pendingMeterScroll.current = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToMeterResult);
    });
  }, [scrollToMeterResult]);

  const handleMeterSearch = useCallback((): void => {
    const parsedCode = meterCodeSchema.safeParse(getValues('code').trim());
    if (parsedCode.success) {
      Keyboard.dismiss();
      if (visibleMeter?.code === parsedCode.data) {
        scrollToMeterResult();
      } else {
        pendingMeterScroll.current = true;
      }
    }

    void handleSubmit(submitMeterCode)();
  }, [getValues, handleSubmit, scrollToMeterResult, submitMeterCode, visibleMeter]);

  return (
    <Screen scrollViewRef={scrollViewRef}>
      <HomeHeader
        displayName={profileName}
        employeeCode={session?.employeeCode ?? ''}
        initials={initials}
        photoPath={profileQuery.data?.photoPath ?? null}
      />

      <Animated.View
        className="w-full"
        entering={FadeIn.delay(90).duration(300)}
      >
        <Card className="gap-5" variant="success">
          <Badge label="Jornada activa" />
          <StatsRow
            items={[
              { label: 'Pendientes', value: String(pendingCount) },
              {
                label: 'Conexión',
                value: isConnected ? 'En línea' : 'Sin red',
                valueClassName: isConnected ? 'text-success' : 'text-danger',
              },
              { label: 'Hoy', value: today },
            ]}
          />
        </Card>
      </Animated.View>

      <View className="gap-3">
        <SectionTitle>Busca un medidor</SectionTitle>
        <Animated.View
          className="w-full"
          entering={FadeIn.delay(170).duration(300)}
        >
          <Card className="gap-4" variant="highlight">
            <Controller
              control={control}
              name="code"
              rules={{ validate: (value) => meterCodeSchema.safeParse(value.trim()).success || 'Usa el formato MED-123456' }}
              render={({ field: { onBlur, onChange, value } }) => (
                <TextInput
                  autoCapitalize="characters"
                  autoCorrect={false}
                  className={inputClassName}
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    onChange(text);
                    setMeterCode('');
                  }}
                  placeholder="MED-123456"
                  placeholderTextColorClassName="accent-content-subtle"
                  value={value}
                />
              )}
            />
            {errors.code ? <Text className="text-sm text-danger">{errors.code.message}</Text> : null}
            <PrimaryButton label="Consultar medidor" onPress={handleMeterSearch} />
          </Card>
        </Animated.View>
      </View>

      <View
        onLayout={({ nativeEvent }) => {
          meterResultOffset.current = nativeEvent.layout.y;
        }}
      >
        {meterQuery.isFetching ? (
          <Animated.View
            className="items-center rounded-3xl border border-line/90 bg-surface/85 p-6"
            entering={FadeInDown.duration(300)}
            onLayout={handleMeterCardLayout}
          >
            <LottieState
              accessibilityLabel="Consultando información del medidor"
              autoPlay
              loop
              sizeClassName="h-28 w-28"
              source={loadingMeterAnimation}
            />
            <Text className="mt-2 text-base font-bold text-content">Consultando...</Text>
          </Animated.View>
        ) : null}
        {meterQuery.isError ? (
          <View className="rounded-2xl border border-danger bg-danger-soft p-3">
            <Text className="text-sm text-danger">{meterQuery.error.message}</Text>
          </View>
        ) : null}

        {visibleMeter ? (
          <Animated.View
            className="overflow-hidden rounded-3xl border border-line/90 bg-surface/85"
            entering={FadeIn.delay(80).duration(820).easing(Easing.out(Easing.cubic))}
            key={visibleMeter.code}
            onLayout={handleMeterCardLayout}
          >
            <View className="relative gap-2 overflow-hidden bg-brand p-5">
              <View className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-dark" />
              <View className="absolute -right-2 top-16 h-14 w-14 rounded-full bg-brand-dark" />
              <View className="absolute -bottom-12 -left-8 h-28 w-28 rounded-full border-[10px] border-white/10" />
              <Text className="relative text-xs font-bold text-on-brand">
                Medidor
              </Text>
              <Text className="relative text-3xl font-extrabold text-white">{visibleMeter.code}</Text>
              <View className="relative self-start">
                <StatusChip label={visibleMeter.status} tone="info" />
              </View>
            </View>
            <View className="p-5">
              {[
                { label: 'Dirección', value: visibleMeter.address },
                { label: 'Sector', value: visibleMeter.sector },
                { label: 'Número de cuenta', value: visibleMeter.accountNumber },
                { label: 'Estado', value: visibleMeter.status },
                { label: 'Última lectura', value: String(visibleMeter.previousReading) },
                { label: 'Fecha de la última lectura', value: visibleMeter.previousReadingDate },
                { label: 'Promedio mensual', value: String(visibleMeter.monthlyAverage) },
              ].map((item, index, details) => (
                <Animated.View
                  entering={FadeInDown.delay(index * 65).duration(280)}
                  key={item.label}
                >
                  <KeyValueRow
                    label={item.label}
                    last={index === details.length - 1}
                    value={item.value}
                  />
                </Animated.View>
              ))}
              <View className="gap-3 border-t border-line pt-4">
                <Text className="text-base font-bold text-content">
                  Ubicación de la última lectura
                </Text>
                {meterLocationQuery.data ? (
                  <>
                    <LocationMap
                      editable={false}
                      height={224}
                      latitude={meterLocationQuery.data.latitude}
                      longitude={meterLocationQuery.data.longitude}
                      onPositionChange={() => undefined}
                    />
                    <Text className="text-sm text-content-muted">
                      {new Date(meterLocationQuery.data.createdAt).toLocaleString('es-EC')} · período {meterLocationQuery.data.period}
                    </Text>
                    <Text className="text-sm text-content-muted">
                      {meterLocationQuery.data.locationSource === 'gps' ? 'GPS' : 'Manual'} · {meterLocationQuery.data.latitude.toFixed(6)}, {meterLocationQuery.data.longitude.toFixed(6)}
                    </Text>
                  </>
                ) : (
                  <Text className="text-sm text-content-muted">
                    Aún no hay una ubicación registrada para este medidor.
                  </Text>
                )}
              </View>
              <View className="pt-4">
                <PrimaryButton
                  label="Registrar lectura"
                  onPress={() => {
                    setMeter(visibleMeter);
                    router.push('/register');
                  }}
                />
              </View>
            </View>
          </Animated.View>
        ) : null}
      </View>

      <View className="gap-3">
        <SectionTitle>Acciones</SectionTitle>
        {[
          {
            glyph: '◎',
            onPress: () => router.push('/profile'),
            subtitle: 'Actualiza tu nombre, teléfono y foto',
            title: 'Editar perfil',
          },
          {
            glyph: '≡',
            onPress: () => router.push('/pending'),
            subtitle: 'Revisa, corrige y verifica envíos',
            title: 'Lecturas registradas',
          },
        ].map((action, index) => (
          <Animated.View
            className="w-full"
            entering={FadeIn.delay(300 + index * 90).duration(260)}
            key={action.title}
          >
            <ListRow
              glyph={action.glyph}
              onPress={action.onPress}
              subtitle={action.subtitle}
              title={action.title}
            />
          </Animated.View>
        ))}
      </View>

      <GhostButton label="Cerrar sesión" onPress={handleSignOut} tone="danger" />
    </Screen>
  );
}
