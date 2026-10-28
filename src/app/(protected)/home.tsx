import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useSession } from '../../context/session-context';
import { useReading } from '../../context/reading-context';
import { deleteDraft, findDraftByEmployee } from '../../repositories/draft-repository';
import { deleteStoredPhoto } from '../../services/photo-storage';
import { findCachedMeter } from '../../repositories/meter-cache-repository';
import { useMeterQuery } from '../../hooks/use-meter-query';
import {
  hasMeaningfulDraftData,
  meterCodeSchema,
  registrationDraftPayloadSchema,
} from '../../types/schemas';

export default function HomeScreen(): React.JSX.Element {
  const { session, signOut } = useSession();
  const { setForm, setMeter } = useReading();
  const [meterCode, setMeterCode] = useState('');
  const { control, handleSubmit, formState: { errors } } = useForm<{ code: string }>({
    defaultValues: { code: '' },
  });
  const meterQuery = useMeterQuery(meterCode);
  const visibleMeter = meterQuery.data?.code === meterCode ? meterQuery.data : null;

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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>JORNADA ACTIVA</Text>
      <Text style={styles.title}>Hola, {session?.employeeCode}</Text>
      <Text style={styles.subtitle}>Consulta un medidor para comenzar el registro.</Text>

      <Controller
        control={control}
        name="code"
        rules={{ validate: (value) => meterCodeSchema.safeParse(value.trim()).success || 'Usa el formato MED-123456' }}
        render={({ field: { onBlur, onChange, value } }) => (
          <TextInput
            autoCapitalize="characters"
            autoCorrect={false}
            onBlur={onBlur}
            onChangeText={(text) => {
              onChange(text);
              setMeterCode('');
            }}
            placeholder="MED-123456"
            style={styles.input}
            value={value}
          />
        )}
      />
      {errors.code ? <Text style={styles.error}>{errors.code.message}</Text> : null}
      <Pressable onPress={handleSubmit(submitMeterCode)} style={styles.button}>
        <Text style={styles.buttonText}>Consultar medidor</Text>
      </Pressable>

      {meterQuery.isFetching ? <Text style={styles.status}>Consultando...</Text> : null}
      {meterQuery.isError ? <Text style={styles.error}>{meterQuery.error.message}</Text> : null}
      {visibleMeter ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{visibleMeter.code}</Text>
          <Text>Dirección: {visibleMeter.address}</Text>
          <Text>Sector: {visibleMeter.sector}</Text>
          <Text>Número de cuenta: {visibleMeter.accountNumber}</Text>
          <Text>Estado: {visibleMeter.status}</Text>
          <Text>Última lectura: {visibleMeter.previousReading}</Text>
          <Text>Fecha: {visibleMeter.previousReadingDate}</Text>
          <Text>Promedio mensual: {visibleMeter.monthlyAverage}</Text>
          <Pressable
            onPress={() => {
              setMeter(visibleMeter);
              router.push('/register');
            }}
            style={styles.startButton}
          >
            <Text style={styles.startButtonText}>Registrar lectura</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable onPress={() => router.push('/pending')} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Ver lecturas registradas</Text>
      </Pressable>
      <Pressable onPress={handleSignOut} style={styles.button}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderColor: '#0B6E69',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 28,
    padding: 15,
  },
  buttonText: { color: '#0B6E69', fontWeight: '700' },
  card: { backgroundColor: '#F2F4F7', borderRadius: 12, gap: 8, marginTop: 20, padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  container: { flexGrow: 1, padding: 28, paddingTop: 64 },
  eyebrow: { color: '#0B6E69', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  error: { color: '#B42318', marginTop: 6 },
  input: { borderColor: '#D0D5DD', borderRadius: 10, borderWidth: 1, fontSize: 16, marginTop: 20, padding: 14 },
  subtitle: { color: '#667085', fontSize: 16, lineHeight: 24, marginTop: 10 },
  status: { color: '#667085', marginTop: 12 },
  startButton: { backgroundColor: '#0B6E69', borderRadius: 10, marginTop: 12, padding: 14 },
  startButtonText: { color: '#FFFFFF', fontWeight: '700', textAlign: 'center' },
  secondaryButton: { borderColor: '#0B6E69', borderRadius: 10, borderWidth: 1, marginTop: 16, padding: 14 },
  secondaryButtonText: { color: '#0B6E69', fontWeight: '700', textAlign: 'center' },
  title: { color: '#101828', fontSize: 30, fontWeight: '800', marginTop: 8 },
});
