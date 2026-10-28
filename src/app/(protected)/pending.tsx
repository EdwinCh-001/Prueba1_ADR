import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useReading } from '../../context/reading-context';
import { findCachedMeter } from '../../repositories/meter-cache-repository';
import { findAllReadings } from '../../repositories/reading-repository';
import { isStoredPhotoAvailable } from '../../services/photo-storage';
import type { Reading } from '../../types/domain';

function StoredPhotoPreview({ path }: { path: string }): React.JSX.Element {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void isStoredPhotoAvailable(path)
      .then((available) => {
        if (active) {
          setIsAvailable(available);
        }
      })
      .catch(() => {
        if (active) {
          setIsAvailable(false);
        }
      });

    return () => {
      active = false;
    };
  }, [path]);

  if (isAvailable === null) {
    return <Text style={styles.photoStatus}>Comprobando fotografía...</Text>;
  }
  if (!isAvailable) {
    return <Text style={styles.photoStatus}>Fotografía no disponible en el almacenamiento.</Text>;
  }

  return (
    <Image
      accessibilityLabel="Fotografía guardada del medidor"
      onError={() => setIsAvailable(false)}
      source={{ uri: path }}
      style={styles.photo}
    />
  );
}

const verificationLabels: Record<Reading['verificationStatus'], string> = {
  pendiente: 'Pendiente de verificar',
  verificada: 'Verificada',
  inconsistente: 'Inconsistente: revisar',
};

export default function PendingScreen(): React.JSX.Element {
  const { setMeter, setEditingReading } = useReading();
  const [readings, setReadings] = useState<Reading[]>([]);

  useEffect(() => {
    void findAllReadings().then(setReadings);
  }, []);

  const editReading = async (reading: Reading): Promise<void> => {
    if (reading.syncStatus === 'enviada') {
      Alert.alert('Lectura enviada', 'Una lectura enviada no puede modificarse.');
      return;
    }
    const meter = await findCachedMeter(reading.meterCode);
    if (!meter) {
      Alert.alert('Medidor no disponible', 'Consulta el medidor nuevamente para editar esta lectura.');
      return;
    }
    setMeter(meter);
    setEditingReading(reading);
    router.push('/register');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.eyebrow}>CONTROL DE LECTURAS</Text>
      <Text style={styles.title}>Lecturas registradas</Text>
      {readings.length === 0 ? <Text style={styles.empty}>No hay lecturas registradas.</Text> : null}
      {readings.map((reading) => (
        <View key={reading.id} style={styles.card}>
          <Text style={styles.cardTitle}>{reading.meterCode}</Text>
          <Text>Período: {reading.period}</Text>
          <Text>Consumo: {reading.consumption ?? 'Sin lectura'}</Text>
          <Text>Fecha: {new Date(reading.createdAt).toLocaleString()}</Text>
          <Text>Verificación: {verificationLabels[reading.verificationStatus]}</Text>
          <Text>Envío: {reading.syncStatus === 'pendiente' ? 'Pendiente de enviar' : 'Enviada'}</Text>
          {reading.photoPath ? <StoredPhotoPreview path={reading.photoPath} /> : null}
          {reading.syncStatus === 'pendiente' ? (
            <Pressable onPress={() => void editReading(reading)} style={styles.button}>
              <Text style={styles.buttonText}>Corregir lectura</Text>
            </Pressable>
          ) : null}
        </View>
      ))}
      <Pressable onPress={() => router.replace('/home')} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Volver al inicio</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: '#0B6E69', borderRadius: 10, marginTop: 12, padding: 14 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', textAlign: 'center' },
  card: { backgroundColor: '#F2F4F7', borderRadius: 12, gap: 6, marginTop: 14, padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: '800' },
  container: { padding: 28, paddingTop: 48 },
  empty: { color: '#667085', marginTop: 20 },
  eyebrow: { color: '#0B6E69', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  secondaryButton: { borderColor: '#0B6E69', borderRadius: 10, borderWidth: 1, marginTop: 24, padding: 14 },
  secondaryButtonText: { color: '#0B6E69', fontWeight: '700', textAlign: 'center' },
  photo: { alignSelf: 'flex-start', borderRadius: 8, height: 180, marginTop: 8, width: '100%' },
  photoStatus: { color: '#667085', fontSize: 12, marginTop: 8 },
  title: { color: '#101828', fontSize: 28, fontWeight: '800', marginTop: 8 },
});
