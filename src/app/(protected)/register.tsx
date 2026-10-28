import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { meterStatusLabels, useReading } from '../../context/reading-context';
import { useSession } from '../../context/session-context';
import { saveReading } from '../../repositories/reading-repository';
import { deleteDraft, saveDraft } from '../../repositories/draft-repository';
import { captureMeterPhoto } from '../../services/photo-storage';
import type { ReadingForm } from '../../types/domain';
import { readingFormSchema, readingSchema } from '../../types/schemas';

const getPeriod = (): string => new Date().toISOString().slice(0, 7);
const getTimestamp = (): string => new Date().toISOString();
const getClientId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `reading-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function RegisterScreen(): React.JSX.Element {
  const { session } = useSession();
  const { meter, form: savedForm, clearReading } = useReading();
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<ReadingForm>({
    defaultValues: savedForm ?? {
      anomalyConfirmed: false,
      currentReading: '',
      damageDescription: '',
      meterStatus: 'normal',
      photoPath: null,
      reason: '',
    },
    resolver: zodResolver(readingFormSchema),
  });
  const meterStatus = useWatch({ control, name: 'meterStatus' });
  const photoPath = useWatch({ control, name: 'photoPath' });
  const currentReading = Number(useWatch({ control, name: 'currentReading' }));
  const formValues = useWatch({ control });
  const consumption = Number.isFinite(currentReading) && meter
    ? currentReading - meter.previousReading
    : null;
  const isAnomalous = consumption !== null
    && meter !== null
    && consumption > meter.monthlyAverage * 3;

  useEffect(() => {
    if (!meter || !session) {
      return;
    }

    if (!formValues.meterStatus) {
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

  const submit = async (value: ReadingForm): Promise<void> => {
    const numericReading = value.currentReading.trim() === '' ? null : Number(value.currentReading);
    const calculatedConsumption = numericReading === null ? null : numericReading - meter.previousReading;
    const anomalous = calculatedConsumption !== null
      && calculatedConsumption > meter.monthlyAverage * 3;

    if (anomalous && !value.anomalyConfirmed) {
      Alert.alert('Consumo anómalo', 'Debes confirmar que revisaste el medidor.');
      return;
    }
    if ((anomalous || value.meterStatus === 'danado') && !value.photoPath) {
      Alert.alert('Foto obligatoria', 'Debes tomar una foto para este registro.');
      return;
    }

    const now = getTimestamp();
    const reading = {
      id: getClientId(),
      meterCode: meter.code,
      period: getPeriod(),
      meterStatus: value.meterStatus,
      currentReading: value.meterStatus === 'inaccesible' ? null : numericReading,
      previousReading: meter.previousReading,
      consumption: value.meterStatus === 'inaccesible' ? null : calculatedConsumption,
      reason: value.meterStatus === 'inaccesible' ? value.reason.trim() : null,
      damageDescription: value.meterStatus === 'danado' ? value.damageDescription.trim() : null,
      photoPath: value.photoPath,
      syncStatus: 'pendiente',
      verificationPending: true,
      createdAt: now,
      updatedAt: now,
    };
    const parsedReading = readingSchema.safeParse(reading);
    if (!parsedReading.success) {
      Alert.alert('Lectura inválida', 'Verifica que la lectura actual no sea menor que la anterior.');
      return;
    }

    await saveReading(parsedReading.data);

    await deleteDraft(session.employeeCode);
    clearReading();
    Alert.alert('Lectura guardada', 'La lectura quedó pendiente de verificación y envío.', [
      { text: 'Aceptar', onPress: () => router.replace('/home') },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>REGISTRO DE LECTURA</Text>
      <Text style={styles.title}>{meter.code}</Text>
      <Text style={styles.subtitle}>Lectura anterior: {meter.previousReading}</Text>

      <Text style={styles.label}>Estado del medidor</Text>
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

      {meterStatus !== 'inaccesible' ? (
        <>
          <Text style={styles.label}>Lectura actual</Text>
          <Controller
            control={control}
            name="currentReading"
            render={({ field: { onBlur, onChange, value } }) => (
              <TextInput
                keyboardType="decimal-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Ej. 135"
                style={styles.input}
                value={value}
              />
            )}
          />
          {errors.currentReading ? <Text style={styles.error}>{errors.currentReading.message}</Text> : null}
          {consumption !== null ? <Text style={styles.info}>Consumo calculado: {consumption}</Text> : null}
          {isAnomalous ? (
            <Controller
              control={control}
              name="anomalyConfirmed"
              render={({ field: { onChange, value } }) => (
                <Pressable onPress={() => onChange(!value)} style={styles.confirmation}>
                  <Text style={styles.warning}>Consumo anómalo: supera tres veces el promedio mensual.</Text>
                  <Text>{value ? '✓ Confirmo que revisé el medidor' : 'Toca para confirmar la revisión'}</Text>
                </Pressable>
              )}
            />
          ) : null}
        </>
      ) : null}

      {meterStatus === 'inaccesible' ? (
        <>
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
        </>
      ) : null}

      {meterStatus === 'danado' ? (
        <>
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
        </>
      ) : null}

      <Controller
        control={control}
        name="photoPath"
        render={({ field: { onChange, value } }) => (
          <View style={styles.photoSection}>
            <Text style={styles.label}>Fotografía del medidor</Text>
            <Pressable
              onPress={async () => {
                const result = await captureMeterPhoto();
                if (result.denied) {
                  Alert.alert(
                    'Permiso de cámara',
                    'La cámara es necesaria para respaldar ciertos registros. Puedes continuar sin foto cuando no sea obligatoria.',
                  );
                  return;
                }
                if (result.path) {
                  onChange(result.path);
                }
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>
                {value ? 'Volver a tomar fotografía' : 'Tomar fotografía'}
              </Text>
            </Pressable>
            {photoPath ? <Text style={styles.info}>Foto guardada en el teléfono.</Text> : null}
          </View>
        )}
      />

      <Pressable disabled={isSubmitting} onPress={handleSubmit(submit)} style={styles.button}>
        <Text style={styles.buttonText}>{isSubmitting ? 'Guardando...' : 'Guardar lectura'}</Text>
      </Pressable>
      <Pressable onPress={() => router.back()} style={styles.cancelButton}>
        <Text style={styles.cancelText}>Cancelar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', backgroundColor: '#0B6E69', borderRadius: 12, marginTop: 28, padding: 16 },
  buttonText: { color: '#FFFFFF', fontWeight: '700' },
  cancelButton: { alignItems: 'center', marginTop: 14, padding: 12 },
  cancelText: { color: '#0B6E69', fontWeight: '700' },
  centered: { flex: 1, justifyContent: 'center', padding: 28 },
  confirmation: { backgroundColor: '#FFF4E5', borderRadius: 10, gap: 8, marginTop: 16, padding: 14 },
  container: { padding: 28, paddingBottom: 48, paddingTop: 64 },
  error: { color: '#B42318', marginTop: 6 },
  eyebrow: { color: '#0B6E69', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  info: { color: '#344054', marginTop: 12 },
  input: { borderColor: '#D0D5DD', borderRadius: 10, borderWidth: 1, fontSize: 16, marginTop: 8, padding: 14 },
  label: { color: '#344054', fontWeight: '600', marginTop: 22 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  option: { borderColor: '#D0D5DD', borderRadius: 10, borderWidth: 1, flex: 1, padding: 12 },
  optionText: { color: '#344054', textAlign: 'center' },
  options: { flexDirection: 'row', gap: 8, marginTop: 10 },
  photoSection: { marginTop: 4 },
  secondaryButton: { borderColor: '#0B6E69', borderRadius: 10, borderWidth: 1, marginTop: 8, padding: 14 },
  secondaryText: { color: '#0B6E69', fontWeight: '700', textAlign: 'center' },
  selectedOption: { backgroundColor: '#E6F4F1', borderColor: '#0B6E69' },
  selectedOptionText: { color: '#0B6E69', fontWeight: '700', textAlign: 'center' },
  subtitle: { color: '#667085', marginTop: 8 },
  title: { color: '#101828', fontSize: 28, fontWeight: '800', marginTop: 6 },
  warning: { color: '#B54708', fontWeight: '700' },
});
