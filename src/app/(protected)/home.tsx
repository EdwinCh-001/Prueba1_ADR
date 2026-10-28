import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useSession } from '../../context/session-context';
import { useReading } from '../../context/reading-context';
import { deleteDraft, findDraftByEmployee } from '../../repositories/draft-repository';
import { deleteStoredPhoto } from '../../services/photo-storage';
import { findCachedMeter } from '../../repositories/meter-cache-repository';
import type { ReadingForm, Meter } from '../../types/domain';
import { useMeterQuery } from '../../hooks/use-meter-query';
import { meterCodeSchema } from '../../types/schemas';

export default function HomeScreen(): React.JSX.Element {
  const { session, signOut } = useSession();
  const { setForm, setMeter } = useReading();
  const [meterCode, setMeterCode] = useState('');
  const { control, handleSubmit, formState: { errors } } = useForm<{ code: string }>({
    defaultValues: { code: '' },
  });
  const meterQuery = useMeterQuery(meterCode);

  useEffect(() => {
    if (!session) {
      return;
    }

    void findDraftByEmployee(session.employeeCode).then((draft) => {
      if (!draft) {
        return;
      }

      Alert.alert('Registro pendiente', '¿Deseas continuar el registro guardado?', [
        {
          text: 'Descartar',
          style: 'destructive',
          onPress: () => {
            void deleteDraft(session.employeeCode);
            void deleteStoredPhoto(draft.photoPath);
          },
        },
        {
          text: 'Continuar',
          onPress: () => {
            try {
              const payload = JSON.parse(draft.payloadJson) as { meter: Meter; form: ReadingForm };
              void findCachedMeter(payload.meter.code).then((cachedMeter) => {
                if (cachedMeter) {
                  setMeter(cachedMeter);
                  setForm(payload.form);
                  router.push('/register');
                }
              });
            } catch {
              void deleteDraft(session.employeeCode);
            }
          },
        },
      ]);
    });
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
            onChangeText={onChange}
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
      {meterQuery.data ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{meterQuery.data.code}</Text>
          <Text>Dirección: {meterQuery.data.address}</Text>
          <Text>Sector: {meterQuery.data.sector}</Text>
          <Text>Número de cuenta: {meterQuery.data.accountNumber}</Text>
          <Text>Estado: {meterQuery.data.status}</Text>
          <Text>Última lectura: {meterQuery.data.previousReading}</Text>
          <Text>Fecha: {meterQuery.data.previousReadingDate}</Text>
          <Text>Promedio mensual: {meterQuery.data.monthlyAverage}</Text>
          <Pressable
            onPress={() => {
              setMeter(meterQuery.data);
              router.push('/register');
            }}
            style={styles.startButton}
          >
            <Text style={styles.startButtonText}>Registrar lectura</Text>
          </Pressable>
        </View>
      ) : null}

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
  container: { flex: 1, padding: 28, paddingTop: 64 },
  eyebrow: { color: '#0B6E69', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  error: { color: '#B42318', marginTop: 6 },
  input: { borderColor: '#D0D5DD', borderRadius: 10, borderWidth: 1, fontSize: 16, marginTop: 20, padding: 14 },
  subtitle: { color: '#667085', fontSize: 16, lineHeight: 24, marginTop: 10 },
  status: { color: '#667085', marginTop: 12 },
  startButton: { backgroundColor: '#0B6E69', borderRadius: 10, marginTop: 12, padding: 14 },
  startButtonText: { color: '#FFFFFF', fontWeight: '700', textAlign: 'center' },
  title: { color: '#101828', fontSize: 30, fontWeight: '800', marginTop: 8 },
});
