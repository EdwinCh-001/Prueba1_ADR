import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Text, TextInput, View } from 'react-native';

import { useSession } from '../../context/session-context';
import { useReading } from '../../context/reading-context';
import { deleteDraft, findDraftByEmployee } from '../../repositories/draft-repository';
import { deleteStoredPhoto } from '../../services/photo-storage';
import { findCachedMeter } from '../../repositories/meter-cache-repository';
import { useMeterQuery } from '../../hooks/use-meter-query';
import { useSyncState } from '../../providers/sync-provider';
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
  LogoPlate,
  PrimaryButton,
  Screen,
  SectionTitle,
  StatsRow,
  StatusChip,
  inputClassName,
} from '../../components/ui';

export default function HomeScreen(): React.JSX.Element {
  const { session, signOut } = useSession();
  const { setForm, setMeter } = useReading();
  const { isConnected, pendingCount } = useSyncState();
  const [meterCode, setMeterCode] = useState('');
  const { control, handleSubmit, formState: { errors } } = useForm<{ code: string }>({
    defaultValues: { code: '' },
  });
  const meterQuery = useMeterQuery(meterCode);
  const visibleMeter = meterQuery.data?.code === meterCode ? meterQuery.data : null;
  const initials = session?.employeeCode.slice(0, 2).toUpperCase() ?? '';
  const today = new Date().toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });

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
          Alert.alert('Borrador descartado', message);
        }
      } catch {
        if (isActive) {
          Alert.alert('Error', 'No se pudo eliminar el borrador guardado.');
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

        Alert.alert('Registro pendiente', '¿Deseas continuar el registro guardado?', [
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => void discardDraft(draft.photoPath),
          },
          {
            text: 'Continuar',
            onPress: () => void restoreDraft(draft.payloadJson, draft.photoPath),
          },
        ]);
      } catch {
        if (isActive) {
          Alert.alert('Error', 'No se pudo revisar el registro guardado.');
        }
      }
    };

    void checkDraft();
    return () => {
      isActive = false;
    };
  }, [session, setForm, setMeter]);

  const handleSignOut = async (): Promise<void> => {
    await signOut();
    router.replace('/login');
  };

  const submitMeterCode = ({ code }: { code: string }): void => {
    const parsedCode = meterCodeSchema.safeParse(code.trim());
    if (parsedCode.success) {
      setMeterCode(parsedCode.data);
      return;
    }

    setMeterCode('');
  };

  return (
    <Screen>
      <View className="gap-4">
        <LogoPlate size="sm" />
        <View className="flex-row items-center justify-between gap-4">
          <Text className="flex-1 text-3xl font-extrabold uppercase tracking-wide text-content">
            Hola, {session?.employeeCode}
          </Text>
          <View className="h-11 w-11 items-center justify-center rounded-full border border-content-muted">
            <Text className="text-sm font-bold text-content">{initials}</Text>
          </View>
        </View>
      </View>

      <Card className="gap-5">
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

      <View className="gap-3">
        <SectionTitle>Consultar medidor</SectionTitle>
        <Card className="gap-4">
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
          <PrimaryButton label="Consultar medidor" onPress={handleSubmit(submitMeterCode)} />
        </Card>
      </View>

      {meterQuery.isFetching ? (
        <View className="flex-row items-center gap-3">
          <ActivityIndicator colorClassName="accent-action" />
          <Text className="text-sm text-content-muted">Consultando...</Text>
        </View>
      ) : null}
      {meterQuery.isError ? (
        <View className="rounded-2xl bg-danger-soft p-3">
          <Text className="text-sm text-danger">{meterQuery.error.message}</Text>
        </View>
      ) : null}

      {visibleMeter ? (
        <View className="overflow-hidden rounded-3xl bg-surface">
          <View className="relative gap-2 overflow-hidden bg-brand p-5">
            <View className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-dark" />
            <View className="absolute -right-2 top-16 h-14 w-14 rounded-full bg-brand-dark" />
            <Text className="text-xs font-bold uppercase tracking-widest text-brand-light">
              Medidor
            </Text>
            <Text className="text-3xl font-extrabold text-white">{visibleMeter.code}</Text>
            <StatusChip label={visibleMeter.status} tone="info" />
          </View>
          <View className="p-5">
            <KeyValueRow label="Dirección" value={visibleMeter.address} />
            <KeyValueRow label="Sector" value={visibleMeter.sector} />
            <KeyValueRow label="Número de cuenta" value={visibleMeter.accountNumber} />
            <KeyValueRow label="Estado" value={visibleMeter.status} />
            <KeyValueRow label="Última lectura" value={String(visibleMeter.previousReading)} />
            <KeyValueRow
              label="Fecha de la última lectura"
              value={visibleMeter.previousReadingDate}
            />
            <KeyValueRow label="Promedio mensual" value={String(visibleMeter.monthlyAverage)} last />
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
        </View>
      ) : null}

      <View className="gap-3">
        <SectionTitle>Acciones</SectionTitle>
        <ListRow
          glyph="≡"
          onPress={() => router.push('/pending')}
          subtitle="Revisa, corrige y verifica envíos"
          title="Lecturas registradas"
        />
      </View>

      <GhostButton label="Cerrar sesión" onPress={handleSignOut} tone="danger" />
    </Screen>
  );
}
