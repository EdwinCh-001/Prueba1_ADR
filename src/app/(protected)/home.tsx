import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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
      <View style={styles.header}>
        <Image accessibilityLabel="Logo de EPMAPS Agua de Quito" resizeMode="contain" source={require('../../../assets/Logo.jpg')} style={styles.logo} />
        <View style={styles.greeting}>
          <Text style={styles.eyebrow}>JORNADA ACTIVA</Text>
          <Text style={styles.title}>Hola, {session?.employeeCode}</Text>
          <Text style={styles.subtitle}>Listo para registrar lecturas en campo.</Text>
        </View>
      </View>
      <View style={styles.accent} />

      <View style={styles.searchCard}>
        <Text style={styles.sectionTitle}>Consultar medidor</Text>
        <Text style={styles.sectionSubtitle}>Ingresa el código de la etiqueta del medidor.</Text>
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
              placeholderTextColor="#94A3B8"
              style={styles.input}
              value={value}
            />
          )}
        />
        {errors.code ? <Text style={styles.error}>{errors.code.message}</Text> : null}
        <Pressable onPress={handleSubmit(submitMeterCode)} style={styles.button}>
          <Text style={styles.buttonText}>Consultar medidor</Text>
        </Pressable>
      </View>

      {meterQuery.isFetching ? <Text style={styles.status}>Consultando...</Text> : null}
      {meterQuery.isError ? <Text style={styles.error}>{meterQuery.error.message}</Text> : null}
      {visibleMeter ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{visibleMeter.code}</Text>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Dirección</Text><Text style={styles.detailValue}>{visibleMeter.address}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Sector</Text><Text style={styles.detailValue}>{visibleMeter.sector}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Número de cuenta</Text><Text style={styles.detailValue}>{visibleMeter.accountNumber}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Estado</Text><Text style={styles.detailValue}>{visibleMeter.status}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Última lectura</Text><Text style={styles.detailValue}>{visibleMeter.previousReading}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Fecha</Text><Text style={styles.detailValue}>{visibleMeter.previousReadingDate}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Promedio mensual</Text><Text style={styles.detailValue}>{visibleMeter.monthlyAverage}</Text></View>
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
  accent: { backgroundColor: '#10B981', borderRadius: 2, height: 4, marginBottom: 24, marginTop: 4, width: 48 },
  button: { alignItems: 'center', backgroundColor: '#059669', borderRadius: 10, marginTop: 18, minHeight: 52, justifyContent: 'center', paddingHorizontal: 16 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 14, borderWidth: 1, elevation: 2, gap: 11, marginTop: 18, padding: 18, shadowColor: '#0F172A', shadowOffset: { height: 3, width: 0 }, shadowOpacity: 0.05, shadowRadius: 8 },
  cardTitle: { color: '#004B87', fontSize: 19, fontWeight: '800', marginBottom: 4 },
  container: { backgroundColor: '#F8FAFC', flexGrow: 1, padding: 22, paddingBottom: 36, paddingTop: 28 },
  detailLabel: { color: '#64748B', flex: 1, fontSize: 13 },
  detailRow: { borderBottomColor: '#F1F5F9', borderBottomWidth: 1, flexDirection: 'row', gap: 12, paddingBottom: 8 },
  detailValue: { color: '#0F172A', flex: 1.2, fontSize: 14, fontWeight: '600' },
  eyebrow: { color: '#004B87', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  error: { color: '#B42318', fontSize: 13, marginTop: 7 },
  greeting: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 14, marginBottom: 12 },
  input: { backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: 10, borderWidth: 1, color: '#0F172A', fontSize: 17, minHeight: 54, marginTop: 20, paddingHorizontal: 14 },
  logo: { height: 64, width: 112 },
  searchCard: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 14, borderWidth: 1, padding: 18 },
  sectionSubtitle: { color: '#64748B', fontSize: 14, lineHeight: 20, marginTop: 5 },
  sectionTitle: { color: '#0F172A', fontSize: 19, fontWeight: '800' },
  startButton: { backgroundColor: '#059669', borderRadius: 10, marginTop: 8, minHeight: 50, justifyContent: 'center', padding: 14 },
  startButtonText: { color: '#FFFFFF', fontWeight: '700', textAlign: 'center' },
  status: { color: '#64748B', marginTop: 12 },
  subtitle: { color: '#64748B', fontSize: 14, lineHeight: 20, marginTop: 5 },
  secondaryButton: { backgroundColor: '#FFFFFF', borderColor: '#004B87', borderRadius: 10, borderWidth: 1, marginTop: 14, minHeight: 50, justifyContent: 'center', padding: 14 },
  secondaryButtonText: { color: '#004B87', fontWeight: '700', textAlign: 'center' },
  title: { color: '#0F172A', fontSize: 25, fontWeight: '800', marginTop: 5 },
});
