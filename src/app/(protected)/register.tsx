import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { meterStatusLabels, useReading } from '../../context/reading-context';
import { useSession } from '../../context/session-context';
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

const getPeriod = (): string => new Date().toISOString().slice(0, 7);
const getTimestamp = (): string => new Date().toISOString();
const getClientId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `reading-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function RegisterScreen(): React.JSX.Element {
  const { session } = useSession();
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
      <View style={styles.centered}>
        <Text>No hay un medidor seleccionado.</Text>
        <Pressable onPress={() => router.replace('/home')} style={styles.button}>
          <Text style={styles.buttonText}>Volver</Text>
        </Pressable>
      </View>
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
        Alert.alert('No se pudo cancelar', 'No se pudo eliminar el borrador. Intenta nuevamente.');
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
      Alert.alert('Consumo anómalo', 'Debes confirmar que revisaste el medidor.');
      return;
    }
    if (photoRequired && !value.photoPath) {
      Alert.alert(
        'Foto obligatoria',
        value.meterStatus === 'danado'
          ? 'Debes fotografiar el medidor dañado para guardar este registro.'
          : 'El consumo supera tres veces el promedio mensual. Debes fotografiar el medidor para guardar este registro.',
      );
      return;
    }

    let storedPhotoPath = value.photoPath;
    if (storedPhotoPath) {
      try {
        const photoAvailable = await isStoredPhotoAvailable(storedPhotoPath);
        if (!photoAvailable && photoRequired) {
          Alert.alert(
            'Foto no disponible',
            'La fotografía obligatoria ya no está en el almacenamiento de la aplicación. Tómala nuevamente para continuar.',
          );
          return;
        }
        if (!photoAvailable) {
          storedPhotoPath = null;
          setValue('photoPath', null);
        }
      } catch {
        Alert.alert(
          'No se pudo validar la foto',
          'No se pudo comprobar el archivo de la fotografía. Intenta tomarla nuevamente.',
        );
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
      Alert.alert('Lectura inválida', 'Verifica que la lectura actual no sea menor que la anterior.');
      return;
    }

    try {
      if (editingReading) {
        const currentReading = await findReadingById(editingReading.id);
        if (!currentReading || currentReading.syncStatus === 'enviada') {
          Alert.alert('Lectura no editable', 'Esta lectura ya fue enviada y no puede modificarse.');
          return;
        }
        const updated = await updateReading({ ...parsedReading.data, id: editingReading.id });
        if (!updated) {
          Alert.alert('Lectura no editable', 'La lectura ya fue enviada y no puede modificarse.');
          return;
        }
      } else {
        await saveReadingAndDeleteDraft(parsedReading.data, session.employeeCode);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (message.includes('unique') || message.includes('constraint')) {
        Alert.alert(
          'Lectura duplicada',
          'Ya existe una lectura registrada para este medidor durante el período actual.',
        );
        return;
      }
      Alert.alert('No se pudo guardar', 'La lectura no pudo guardarse. Intenta nuevamente.');
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
    Alert.alert(
      editingReading ? 'Lectura corregida' : 'Lectura guardada',
      editingReading
        ? 'La lectura pendiente fue actualizada.'
        : 'La lectura quedó pendiente de verificación y envío.',
      [
      { text: 'Aceptar', onPress: () => router.replace('/home') },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>REGISTRO DE LECTURA</Text>
      <Text style={styles.title}>{meter.code}</Text>
      <Text style={styles.subtitle}>Lectura anterior: {meter.previousReading}</Text>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Estado del medidor</Text>
        <Text style={styles.sectionSubtitle}>Selecciona la condición observada en campo.</Text>
        <View style={styles.options}>
          {(Object.keys(meterStatusLabels) as ReadingForm['meterStatus'][]).map((status) => (
            <Controller
              control={control}
              key={status}
              name="meterStatus"
              render={({ field: { onChange, value } }) => (
                <Pressable
                  onPress={() => onChange(status)}
                  style={[styles.option, value === status && styles.selectedOption]}
                >
                  <Text style={value === status ? styles.selectedOptionText : styles.optionText}>
                    {meterStatusLabels[status]}
                  </Text>
                </Pressable>
              )}
            />
          ))}
        </View>
      </View>

      {meterStatus !== 'inaccesible' ? (
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Lectura y consumo</Text>
          <Text style={styles.label}>Lectura actual</Text>
          <Controller
            control={control}
            name="currentReading"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput
                keyboardType="decimal-pad"
                onBlur={onBlur}
                onChangeText={(text) => {
                  onChange(text);
                }}
                placeholder="Ej. 135"
                style={styles.input}
                value={value}
              />
            )}
          />
          {errors.currentReading ? <Text style={styles.error}>{errors.currentReading.message}</Text> : null}
          {consumption !== null ? (
            <View style={styles.consumptionCard}>
              <Text style={styles.consumptionLabel}>CONSUMO CALCULADO</Text>
              <Text style={styles.consumptionValue}>{consumption}</Text>
              <Text style={styles.consumptionUnit}>unidades</Text>
            </View>
          ) : null}
          {isAnomalous ? (
            <Controller
              control={control}
              name="anomalyConfirmed"
              render={({ field: { onChange, value } }) => (
                <Pressable onPress={() => onChange(!value)} style={styles.confirmation}>
                  <Text style={styles.warning}>Consumo anómalo</Text>
                  <Text style={styles.warningDescription}>Supera tres veces el promedio mensual.</Text>
                  <Text style={styles.confirmationText}>
                    {value ? '✓ Confirmo que revisé el medidor' : 'Toca para confirmar la revisión'}
                  </Text>
                </Pressable>
              )}
            />
          ) : null}
        </View>
      ) : null}

      {meterStatus === 'inaccesible' ? (
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Visita sin lectura</Text>
          <Text style={styles.label}>Motivo de inaccesibilidad</Text>
          <Controller
            control={control}
            name="reason"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput
                multiline
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Indica por qué no fue posible acceder"
                style={[styles.input, styles.multiline]}
                value={value}
              />
            )}
          />
          {errors.reason ? <Text style={styles.error}>{errors.reason.message}</Text> : null}
        </View>
      ) : null}

      {meterStatus === 'danado' ? (
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Detalle del daño</Text>
          <Text style={styles.label}>Descripción del daño</Text>
          <Controller
            control={control}
            name="damageDescription"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput
                multiline
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Describe el daño observado"
                style={[styles.input, styles.multiline]}
                value={value}
              />
            )}
          />
          {errors.damageDescription ? <Text style={styles.error}>{errors.damageDescription.message}</Text> : null}
        </View>
      ) : null}

      <Controller
        control={control}
        name="photoPath"
        render={({ field: { onChange, value } }) => (
          <View style={[styles.formCard, styles.photoSection]}>
            <Text style={styles.label}>
              Fotografía del medidor{photoRequired ? ' (obligatoria)' : ' (opcional)'}
            </Text>
            <Text style={styles.info}>
              {photoRequired
                ? 'Se requiere para medidores dañados o consumos anómalos.'
                : 'Puedes adjuntar una foto como respaldo; también puedes continuar sin ella.'}
            </Text>
            <Pressable
              onPress={async () => {
                try {
                  const result = await captureMeterPhoto();
                  if (result.denied) {
                    Alert.alert(
                      'Permiso de cámara denegado',
                      photoRequired
                        ? 'La cámara es necesaria para fotografiar un medidor dañado o documentar un consumo anómalo. Sin esa foto obligatoria no se puede guardar el registro. Habilita el permiso en Ajustes y vuelve a intentarlo.'
                        : 'La cámara permite adjuntar una fotografía de respaldo. En este registro la foto es opcional, por lo que puedes cerrar este aviso y continuar sin foto.',
                    );
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
                      Alert.alert(
                        'No se pudo guardar el borrador',
                        'La fotografía no quedó asociada al registro. Intenta tomarla nuevamente.',
                      );
                      return;
                    }
                    if (photoPath && photoPath !== result.path) {
                      await deleteStoredPhoto(photoPath);
                    }
                    onChange(result.path);
                  }
                } catch {
                  Alert.alert(
                    'No se pudo guardar la foto',
                    'No se pudo conservar la fotografía en el almacenamiento de la aplicación. Intenta nuevamente.',
                  );
                }
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>
                {value
                  ? 'Volver a tomar fotografía'
                  : photoRequired
                    ? 'Tomar fotografía requerida'
                    : 'Agregar fotografía (opcional)'}
              </Text>
            </Pressable>
            {photoPath ? (
              photoCheck?.path === photoPath && photoCheck.available ? (
                <>
                  <Text style={styles.info}>Fotografía guardada en el almacenamiento de la aplicación.</Text>
                  <Image
                    accessibilityLabel="Fotografía persistente del medidor"
                    onError={() => setPhotoCheck({ path: photoPath, available: false })}
                    source={{ uri: photoPath }}
                    style={styles.photoPreview}
                  />
                </>
              ) : photoCheck?.path === photoPath ? (
                <Text style={photoRequired ? styles.error : styles.info}>
                  {photoRequired
                    ? 'La fotografía no está disponible. Debes tomarla nuevamente para guardar.'
                    : 'La fotografía opcional no está disponible; puedes continuar sin ella.'}
                </Text>
              ) : (
                <Text style={styles.info}>Comprobando que la fotografía esté guardada...</Text>
              )
            ) : null}
          </View>
        )}
      />

      <Pressable disabled={isSubmitting} onPress={handleSubmit(submit)} style={styles.button}>
        <Text style={styles.buttonText}>{isSubmitting ? 'Guardando...' : 'Guardar lectura'}</Text>
      </Pressable>
      <Pressable onPress={() => void cancelRegistration()} style={styles.cancelButton}>
        <Text style={styles.cancelText}>Cancelar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', backgroundColor: '#059669', borderRadius: 11, marginTop: 22, minHeight: 54, justifyContent: 'center', padding: 16 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  cancelButton: { alignItems: 'center', marginTop: 10, minHeight: 48, justifyContent: 'center', padding: 12 },
  cancelText: { color: '#64748B', fontWeight: '700' },
  centered: { backgroundColor: '#F8FAFC', flex: 1, justifyContent: 'center', padding: 24 },
  confirmation: { backgroundColor: '#FFF7ED', borderColor: '#FDBA74', borderRadius: 11, borderWidth: 1, gap: 7, marginTop: 16, padding: 16 },
  confirmationText: { color: '#7C2D12', fontWeight: '700', marginTop: 4 },
  consumptionCard: { alignItems: 'center', backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderRadius: 12, borderWidth: 1, marginTop: 16, padding: 16 },
  consumptionLabel: { color: '#004B87', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  consumptionUnit: { color: '#64748B', fontSize: 13, marginTop: 2 },
  consumptionValue: { color: '#004B87', fontSize: 36, fontWeight: '900', marginTop: 4 },
  container: { backgroundColor: '#F8FAFC', padding: 22, paddingBottom: 42, paddingTop: 28 },
  error: { color: '#B42318', fontSize: 13, marginTop: 7 },
  eyebrow: { color: '#004B87', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  formCard: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 14, borderWidth: 1, elevation: 2, marginTop: 18, padding: 18, shadowColor: '#0F172A', shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.05, shadowRadius: 8 },
  info: { color: '#64748B', fontSize: 14, lineHeight: 20, marginTop: 10 },
  input: { backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: 10, borderWidth: 1, color: '#0F172A', fontSize: 17, minHeight: 54, marginTop: 8, paddingHorizontal: 14 },
  label: { color: '#334155', fontSize: 14, fontWeight: '700', marginTop: 18 },
  multiline: { minHeight: 96, paddingTop: 14, textAlignVertical: 'top' },
  option: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: 10, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 48, padding: 10 },
  optionText: { color: '#334155', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  options: { flexDirection: 'row', gap: 8, marginTop: 14 },
  photoSection: { marginTop: 18 },
  photoPreview: { alignSelf: 'flex-start', borderRadius: 10, height: 200, marginTop: 12, width: '100%' },
  secondaryButton: { backgroundColor: '#F8FAFC', borderColor: '#004B87', borderRadius: 10, borderWidth: 1, marginTop: 12, minHeight: 50, justifyContent: 'center', padding: 14 },
  secondaryText: { color: '#004B87', fontWeight: '700', textAlign: 'center' },
  sectionSubtitle: { color: '#64748B', fontSize: 14, lineHeight: 20, marginTop: 5 },
  sectionTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  selectedOption: { backgroundColor: '#EFF6FF', borderColor: '#004B87' },
  selectedOptionText: { color: '#004B87', fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#64748B', fontSize: 15, marginTop: 6 },
  title: { color: '#0F172A', fontSize: 28, fontWeight: '900', marginTop: 6 },
  warning: { color: '#9A3412', fontSize: 16, fontWeight: '800' },
  warningDescription: { color: '#9A3412', fontSize: 14, lineHeight: 20 },
});
