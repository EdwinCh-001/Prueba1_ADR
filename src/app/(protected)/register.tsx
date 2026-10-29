import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Image, Pressable, Text, TextInput, View } from 'react-native';

import { meterStatusLabels, useReading } from '../../context/reading-context';
import { useSession } from '../../context/session-context';
import { useNotice } from '../../context/notice-context';
import {
  findReadingById,
  saveReadingAndDeleteDraft,
  updateReading,
} from '../../repositories/reading-repository';
import { deleteDraft, saveDraft } from '../../repositories/draft-repository';
import {
  captureMeterPhoto,
  deleteStoredPhoto,
  isStoredPhotoAvailable,
} from '../../services/photo-storage';
import type { ReadingForm } from '../../types/domain';
import {
  hasMeaningfulDraftData,
  isAnomalousConsumption,
  isPhotoRequired,
  readingFormSchema,
  readingSchema,
} from '../../types/schemas';
import { useSyncState } from '../../providers/sync-provider';
import {
  AccentBar,
  Card,
  Field,
  GhostButton,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SectionTitle,
  StatsRow,
  StatusChip,
} from '../../components/ui';

const getPeriod = (): string => new Date().toISOString().slice(0, 7);
const getTimestamp = (): string => new Date().toISOString();
const getClientId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `reading-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const consumptionInputClassName =
  'h-16 rounded-2xl border border-line bg-field px-4 text-center text-3xl font-bold text-content focus:border-brand-light';
const multilineInputClassName =
  'min-h-24 rounded-2xl border border-line bg-field px-4 pt-3 text-base text-content focus:border-brand-light';

const selectedStatusClasses: Record<ReadingForm['meterStatus'], string> = {
  normal: 'border-success bg-success-soft',
  inaccesible: 'border-warning bg-warning-soft',
  danado: 'border-danger bg-danger-soft',
};

export default function RegisterScreen(): React.JSX.Element {
  const { session } = useSession();
  const { showNotice } = useNotice();
  const { meter, form: savedForm, editingReading, clearReading } = useReading();
  const { isConnected, refreshPendingCount, synchronize } = useSyncState();
  const { control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<ReadingForm>({
    defaultValues: savedForm ?? (editingReading ? {
      anomalyConfirmed: false,
      currentReading: editingReading.currentReading?.toString() ?? '',
      damageDescription: editingReading.damageDescription ?? '',
      meterStatus: editingReading.meterStatus,
      photoPath: editingReading.photoPath,
      reason: editingReading.reason ?? '',
    } : {
      anomalyConfirmed: false,
      currentReading: '',
      damageDescription: '',
      meterStatus: 'normal',
      photoPath: null,
      reason: '',
    }),
    resolver: zodResolver(readingFormSchema),
  });
  const meterStatus = useWatch({ control, name: 'meterStatus' });
  const photoPath = useWatch({ control, name: 'photoPath' });
  const currentReadingInput = useWatch({ control, name: 'currentReading' });
  const currentReading = currentReadingInput.trim() === '' ? null : Number(currentReadingInput);
  const formValues = useWatch({ control });
  const consumption = meterStatus !== 'inaccesible'
    && currentReading !== null
    && meter
    ? currentReading - meter.previousReading
    : null;
  const photoRequired = meter
    ? isPhotoRequired(
      meterStatus,
      meterStatus === 'inaccesible' ? null : currentReading,
      meter.previousReading,
      meter.monthlyAverage,
    )
    : false;
  const [photoCheck, setPhotoCheck] = useState<{ path: string; available: boolean } | null>(null);
  const isAnomalous = meter
    ? isAnomalousConsumption(
      meterStatus === 'inaccesible' ? null : currentReading,
      meter.previousReading,
      meter.monthlyAverage,
    )
    : false;

  useEffect(() => {
    if (!photoPath) {
      return;
    }

    let active = true;
    void isStoredPhotoAvailable(photoPath)
      .then((available) => {
        if (active) {
          setPhotoCheck({ path: photoPath, available });
        }
      })
      .catch(() => {
        if (active) {
          setPhotoCheck({ path: photoPath, available: false });
        }
      });

    return () => {
      active = false;
    };
  }, [photoPath]);

  useEffect(() => {
    if (!meter || !session) {
      return;
    }

    if (!formValues.meterStatus) {
      return;
    }

    if (!hasMeaningfulDraftData(formValues)) {
      void deleteDraft(session.employeeCode);
      return;
    }

    void saveDraft({
      employeeCode: session.employeeCode,
      meterCode: meter.code,
      currentStep: 'register',
      payloadJson: JSON.stringify({ meter, form: formValues }),
      photoPath: formValues.photoPath ?? null,
      updatedAt: new Date().toISOString(),
    });
  }, [formValues, meter, session]);

  if (!meter || !session) {
    return (
      <Screen contentContainerClassName="justify-center">
        <Card className="items-center gap-4">
          <Text className="text-center text-base text-content">No hay un medidor seleccionado.</Text>
          <PrimaryButton label="Volver" onPress={() => router.replace('/home')} />
        </Card>
      </Screen>
    );
  }

  const cancelRegistration = async (): Promise<void> => {
    if (session) {
      try {
        await deleteDraft(session.employeeCode);
        if (!editingReading) {
          await deleteStoredPhoto(photoPath);
        }
      } catch {
        showNotice({ title: 'No se pudo cancelar', message: 'No se pudo eliminar el borrador. Intenta nuevamente.', tone: 'danger' });
        return;
      }
    }
    clearReading();
    router.replace('/home');
  };

  const submit = async (value: ReadingForm): Promise<void> => {
    const numericReading = value.currentReading.trim() === '' ? null : Number(value.currentReading);
    const readingValue = value.meterStatus === 'inaccesible' ? null : numericReading;
    const calculatedConsumption = readingValue === null
      ? null
      : readingValue - meter.previousReading;
    const anomalous = isAnomalousConsumption(
      readingValue,
      meter.previousReading,
      meter.monthlyAverage,
    );
    if (anomalous && !value.anomalyConfirmed) {
      showNotice({ title: 'Consumo anómalo', message: 'Debes confirmar que revisaste el medidor.', tone: 'warning' });
      return;
    }
    if (photoRequired && !value.photoPath) {
      showNotice({
        title: 'Foto obligatoria',
        message: value.meterStatus === 'danado'
          ? 'Debes fotografiar el medidor dañado para guardar este registro.'
          : 'El consumo supera tres veces el promedio mensual. Debes fotografiar el medidor para guardar este registro.',
        tone: 'warning',
      });
      return;
    }

    let storedPhotoPath = value.photoPath;
    if (storedPhotoPath) {
      try {
        const photoAvailable = await isStoredPhotoAvailable(storedPhotoPath);
        if (!photoAvailable && photoRequired) {
          showNotice({
            title: 'Foto no disponible',
            message: 'La fotografía obligatoria ya no está en el almacenamiento de la aplicación. Tómala nuevamente para continuar.',
            tone: 'danger',
          });
          return;
        }
        if (!photoAvailable) {
          storedPhotoPath = null;
          setValue('photoPath', null);
        }
      } catch {
        showNotice({
          title: 'No se pudo validar la foto',
          message: 'No se pudo comprobar el archivo de la fotografía. Intenta tomarla nuevamente.',
          tone: 'danger',
        });
        return;
      }
    }

    const now = getTimestamp();
    const reading = {
      id: getClientId(),
      meterCode: meter.code,
      period: getPeriod(),
      meterStatus: value.meterStatus,
      currentReading: readingValue,
      previousReading: meter.previousReading,
      consumption: value.meterStatus === 'inaccesible' ? null : calculatedConsumption,
      reason: value.meterStatus === 'inaccesible' ? value.reason.trim() : null,
      damageDescription: value.meterStatus === 'danado' ? value.damageDescription.trim() : null,
      photoPath: storedPhotoPath,
      syncStatus: 'pendiente',
      verificationPending: true,
      verificationStatus: 'pendiente',
      createdAt: now,
      updatedAt: now,
    };

    const parsedReading = readingSchema.safeParse(reading);
    if (!parsedReading.success) {
      showNotice({ title: 'Lectura inválida', message: 'Verifica que la lectura actual no sea menor que la anterior.', tone: 'danger' });
      return;
    }

    try {
      if (editingReading) {
        const currentReading = await findReadingById(editingReading.id);
        if (!currentReading || currentReading.syncStatus === 'enviada') {
          showNotice({ title: 'Lectura no editable', message: 'Esta lectura ya fue enviada y no puede modificarse.', tone: 'warning' });
          return;
        }
        const updated = await updateReading({ ...parsedReading.data, id: editingReading.id });
        if (!updated) {
          showNotice({ title: 'Lectura no editable', message: 'La lectura ya fue enviada y no puede modificarse.', tone: 'warning' });
          return;
        }
      } else {
        await saveReadingAndDeleteDraft(parsedReading.data, session.employeeCode);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (message.includes('unique') || message.includes('constraint')) {
        showNotice({
          title: 'Lectura duplicada',
          message: 'Ya existe una lectura registrada para este medidor durante el período actual.',
          tone: 'warning',
        });
        return;
      }
      showNotice({ title: 'No se pudo guardar', message: 'La lectura no pudo guardarse. Intenta nuevamente.', tone: 'danger' });
      return;
    }

    if (editingReading) {
      await deleteDraft(session.employeeCode);
    }
    await refreshPendingCount();
    if (isConnected) {
      void synchronize();
    }
    clearReading();
    showNotice({
      title: editingReading ? 'Lectura corregida' : 'Lectura guardada',
      message: editingReading
        ? 'La lectura pendiente fue actualizada.'
        : 'La lectura quedó pendiente de verificación y envío.',
      tone: 'success',
      actions: [{ label: 'Aceptar', onPress: () => router.replace('/home') }],
    });
  };

  return (
    <Screen>
      <View className="overflow-hidden rounded-3xl border border-line/90 bg-surface/85">
        <View className="gap-2 bg-brand p-5">
          <Text className="text-xs font-bold uppercase tracking-widest text-on-brand">
            Registro de lectura
          </Text>
          <Text className="text-3xl font-extrabold text-white">{meter.code}</Text>
        </View>
        <AccentBar />
        <View className="p-5">
          <StatsRow
            items={[
              { label: 'Lectura anterior', value: String(meter.previousReading) },
              { label: 'Promedio mensual', value: String(meter.monthlyAverage) },
            ]}
          />
        </View>
      </View>

      <Card className="gap-4">
        <SectionTitle showIcon>Estado del medidor</SectionTitle>
        <Text className="text-sm text-content-muted">
          Selecciona la condición observada en campo.
        </Text>
        <View className="flex-row gap-2">
          {(Object.keys(meterStatusLabels) as ReadingForm['meterStatus'][]).map((status) => (
            <Controller
              control={control}
              key={status}
              name="meterStatus"
              render={({ field: { onChange, value } }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: value === status }}
                  className={`flex-1 items-center rounded-2xl border py-3 ${
                    value === status ? selectedStatusClasses[status] : 'border-line bg-field'
                  }`}
                  onPress={() => onChange(status)}
                >
                  <Text
                    className={`text-center text-sm font-bold ${
                      value === status ? 'text-content' : 'text-content-muted'
                    }`}
                  >
                    {meterStatusLabels[status]}
                  </Text>
                </Pressable>
              )}
            />
          ))}
        </View>
      </Card>

      {meterStatus !== 'inaccesible' ? (
        <Card className="gap-4">
          <SectionTitle showIcon>Lectura y consumo</SectionTitle>
          <Field error={errors.currentReading?.message} label="Lectura actual">
            <Controller
              control={control}
              name="currentReading"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextInput
                  className={consumptionInputClassName}
                  keyboardType="decimal-pad"
                  onBlur={onBlur}
                  onChangeText={(text) => {
                    onChange(text);
                  }}
                  placeholder="Ej. 135"
                  placeholderTextColorClassName="accent-content-subtle"
                  value={value}
                />
              )}
            />
          </Field>
          {consumption !== null ? (
            <View className="items-center gap-1 rounded-2xl border border-line bg-field p-5">
              <Text className="text-xs font-bold uppercase tracking-widest text-content-muted">
                Consumo calculado
              </Text>
              <Text
                className={`text-5xl font-extrabold ${
                  isAnomalous ? 'text-warning' : 'text-success'
                }`}
              >
                {consumption}
              </Text>
              <Text className="text-sm text-content-muted">unidades</Text>
            </View>
          ) : null}
          {isAnomalous ? (
            <Controller
              control={control}
              name="anomalyConfirmed"
              render={({ field: { onChange, value } }) => (
                <View className="gap-3 rounded-2xl border border-warning bg-warning-soft p-4">
                  <Text className="text-2xl text-warning">⚠</Text>
                  <Text className="text-base font-bold text-warning">Consumo anómalo</Text>
                  <Text className="text-sm text-warning">
                    Supera tres veces el promedio mensual.
                  </Text>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: Boolean(value) }}
                    className="flex-row items-center gap-3"
                    onPress={() => onChange(!value)}
                  >
                    <View
                      className={`h-6 w-6 items-center justify-center rounded-md border-2 ${
                        value ? 'border-warning bg-warning' : 'border-warning'
                      }`}
                    >
                      {value ? <Text className="text-xs font-bold text-white">✓</Text> : null}
                    </View>
                    <Text className="flex-1 text-sm font-bold text-warning">
                      {value ? '✓ Confirmo que revisé el medidor' : 'Toca para confirmar la revisión'}
                    </Text>
                  </Pressable>
                </View>
              )}
            />
          ) : null}
        </Card>
      ) : null}

      {meterStatus === 'inaccesible' ? (
        <Card className="gap-4">
          <SectionTitle showIcon>Visita sin lectura</SectionTitle>
          <Field error={errors.reason?.message} label="Motivo de inaccesibilidad">
            <Controller
              control={control}
              name="reason"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextInput
                  className={multilineInputClassName}
                  multiline
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Indica por qué no fue posible acceder"
                  placeholderTextColorClassName="accent-content-subtle"
                  // textAlignVertical no tiene equivalente en className.
                  style={{ textAlignVertical: 'top' }}
                  value={value}
                />
              )}
            />
          </Field>
        </Card>
      ) : null}

      {meterStatus === 'danado' ? (
        <Card className="gap-4">
          <SectionTitle showIcon>Detalle del daño</SectionTitle>
          <Field error={errors.damageDescription?.message} label="Descripción del daño">
            <Controller
              control={control}
              name="damageDescription"
              render={({ field: { onBlur, onChange, value } }) => (
                <TextInput
                  className={multilineInputClassName}
                  multiline
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Describe el daño observado"
                  placeholderTextColorClassName="accent-content-subtle"
                  // textAlignVertical no tiene equivalente en className.
                  style={{ textAlignVertical: 'top' }}
                  value={value}
                />
              )}
            />
          </Field>
        </Card>
      ) : null}

      <Controller
        control={control}
        name="photoPath"
        render={({ field: { onChange, value } }) => (
          <Card className="gap-4">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="flex-1 text-lg font-bold text-content">Fotografía del medidor</Text>
              <StatusChip
                label={photoRequired ? 'Obligatoria' : 'Opcional'}
                tone={photoRequired ? 'danger' : 'neutral'}
                showIcon
                className={photoRequired ? 'border-danger' : ''}
              />
            </View>
            {value ? (
              <Text className="text-sm text-content-muted">
                {photoRequired
                  ? 'Se requiere para medidores dañados o consumos anómalos.'
                  : 'Puedes adjuntar una foto como respaldo; también puedes continuar sin ella.'}
              </Text>
            ) : (
              <View className="rounded-2xl border border-dashed border-line p-5">
                <Text className="text-sm text-content-muted">
                  {photoRequired
                    ? 'Se requiere para medidores dañados o consumos anómalos.'
                    : 'Puedes adjuntar una foto como respaldo; también puedes continuar sin ella.'}
                </Text>
              </View>
            )}
            <SecondaryButton
              label={
                value
                  ? 'Volver a tomar fotografía'
                  : photoRequired
                    ? 'Tomar fotografía requerida'
                    : 'Agregar fotografía (opcional)'
              }
              onPress={async () => {
                try {
                  const result = await captureMeterPhoto();
                  if (result.denied) {
                    showNotice({
                      title: 'Permiso de cámara denegado',
                      message: photoRequired
                        ? 'La cámara es necesaria para fotografiar un medidor dañado o documentar un consumo anómalo. Sin esa foto obligatoria no se puede guardar el registro. Habilita el permiso en Ajustes y vuelve a intentarlo.'
                        : 'La cámara permite adjuntar una fotografía de respaldo. En este registro la foto es opcional, por lo que puedes cerrar este aviso y continuar sin foto.',
                      tone: photoRequired ? 'warning' : 'info',
                    });
                    return;
                  }
                  if (result.path) {
                    try {
                      await saveDraft({
                        employeeCode: session.employeeCode,
                        meterCode: meter.code,
                        currentStep: 'register',
                        payloadJson: JSON.stringify({
                          meter,
                          form: { ...formValues, photoPath: result.path },
                        }),
                        photoPath: result.path,
                        updatedAt: new Date().toISOString(),
                      });
                    } catch {
                      await deleteStoredPhoto(result.path);
                      showNotice({
                        title: 'No se pudo guardar el borrador',
                        message: 'La fotografía no quedó asociada al registro. Intenta tomarla nuevamente.',
                        tone: 'danger',
                      });
                      return;
                    }
                    if (photoPath && photoPath !== result.path) {
                      await deleteStoredPhoto(photoPath);
                    }
                    onChange(result.path);
                  }
                } catch {
                  showNotice({
                    title: 'No se pudo guardar la foto',
                    message: 'No se pudo conservar la fotografía en el almacenamiento de la aplicación. Intenta nuevamente.',
                    tone: 'danger',
                  });
                }
              }}
            />
            {photoPath ? (
              photoCheck?.path === photoPath && photoCheck.available ? (
                <>
                  <Text className="text-sm text-content-muted">
                    Fotografía guardada en el almacenamiento de la aplicación.
                  </Text>
                  <Image
                    accessibilityLabel="Fotografía persistente del medidor"
                    className="h-48 w-full rounded-2xl"
                    onError={() => setPhotoCheck({ path: photoPath, available: false })}
                    source={{ uri: photoPath }}
                  />
                </>
              ) : photoCheck?.path === photoPath ? (
                <Text className={`text-sm ${photoRequired ? 'text-danger' : 'text-content-muted'}`}>
                  {photoRequired
                    ? 'La fotografía no está disponible. Debes tomarla nuevamente para guardar.'
                    : 'La fotografía opcional no está disponible; puedes continuar sin ella.'}
                </Text>
              ) : (
                <Text className="text-sm text-content-muted">
                  Comprobando que la fotografía esté guardada...
                </Text>
              )
            ) : null}
          </Card>
        )}
      />

      <View className="gap-2">
        <PrimaryButton
          disabled={isSubmitting}
          label={isSubmitting ? 'Guardando...' : 'Guardar lectura'}
          onPress={handleSubmit(submit)}
        />
        <GhostButton label="Cancelar" onPress={() => void cancelRegistration()} />
      </View>
    </Screen>
  );
}
