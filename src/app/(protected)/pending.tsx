import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';

import { useReading } from '../../context/reading-context';
import { findCachedMeter } from '../../repositories/meter-cache-repository';
import { findAllReadings } from '../../repositories/reading-repository';
import { isStoredPhotoAvailable } from '../../services/photo-storage';
import type { Reading } from '../../types/domain';
import { useSyncState } from '../../providers/sync-provider';
import {
  Card,
  GhostButton,
  KeyValueRow,
  Screen,
  SecondaryButton,
  StatusChip,
} from '../../components/ui';
import type { StatusTone } from '../../components/ui';

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
    return <Text className="text-sm text-content-muted">Comprobando fotografía...</Text>;
  }
  if (!isAvailable) {
    return (
      <Text className="text-sm text-content-muted">
        Fotografía no disponible en el almacenamiento.
      </Text>
    );
  }

  return (
    <Image
      accessibilityLabel="Fotografía guardada del medidor"
      className="h-48 w-full rounded-2xl"
      onError={() => setIsAvailable(false)}
      source={{ uri: path }}
    />
  );
}

const verificationLabels: Record<Reading['verificationStatus'], string> = {
  pendiente: 'Pendiente de verificar',
  verificada: 'Verificada',
  inconsistente: 'Inconsistente: revisar',
};

const verificationTones: Record<Reading['verificationStatus'], StatusTone> = {
  pendiente: 'info',
  verificada: 'success',
  inconsistente: 'danger',
};

export default function PendingScreen(): React.JSX.Element {
  const { setMeter, setEditingReading } = useReading();
  const { pendingCount } = useSyncState();
  const [readings, setReadings] = useState<Reading[]>([]);

  useEffect(() => {
    void findAllReadings().then(setReadings);
  }, [pendingCount]);

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
    <Screen>
      <View className="gap-1">
        <Text className="text-xs font-bold uppercase tracking-widest text-brand-light">
          Control de lecturas
        </Text>
        <Text className="text-3xl font-extrabold uppercase tracking-wide text-content">
          Lecturas registradas
        </Text>
      </View>

      {readings.length === 0 ? (
        <Card className="items-center gap-3 py-8">
          <Text className="text-3xl text-content-muted">≡</Text>
          <Text className="text-base text-content-muted">No hay lecturas registradas.</Text>
        </Card>
      ) : null}

      {readings.map((reading) => (
        <Card className="gap-3" key={reading.id}>
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-lg font-bold text-content">{reading.meterCode}</Text>
            <StatusChip
              label={reading.syncStatus === 'pendiente' ? 'Pendiente de enviar' : 'Enviada'}
              tone={reading.syncStatus === 'pendiente' ? 'warning' : 'success'}
            />
          </View>

          <View>
            <KeyValueRow label="Período" value={reading.period} />
            <KeyValueRow label="Consumo" value={String(reading.consumption ?? 'Sin lectura')} />
            <KeyValueRow label="Fecha" last value={new Date(reading.createdAt).toLocaleString()} />
          </View>

          <StatusChip
            label={verificationLabels[reading.verificationStatus]}
            tone={verificationTones[reading.verificationStatus]}
          />

          {reading.photoPath ? <StoredPhotoPreview path={reading.photoPath} /> : null}

          {reading.syncStatus === 'pendiente' ? (
            <SecondaryButton label="Corregir lectura" onPress={() => void editReading(reading)} />
          ) : null}
        </Card>
      ))}

      <GhostButton label="Volver al inicio" onPress={() => router.replace('/home')} />
    </Screen>
  );
}
