import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';

import { useReading } from '../../context/reading-context';
import { useNotice } from '../../context/notice-context';
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
  const { showNotice } = useNotice();
  const { pendingCount } = useSyncState();
  const [readings, setReadings] = useState<Reading[]>([]);

  useEffect(() => {
    void findAllReadings().then(setReadings);
  }, [pendingCount]);

  const editReading = async (reading: Reading): Promise<void> => {
    if (reading.syncStatus === 'enviada') {
      showNotice({ title: 'Lectura enviada', message: 'Una lectura enviada no puede modificarse.', tone: 'warning' });
      return;
    }
    const meter = await findCachedMeter(reading.meterCode);
    if (!meter) {
      showNotice({ title: 'Medidor no disponible', message: 'Consulta el medidor nuevamente para editar esta lectura.', tone: 'danger' });
      return;
    }
    setMeter(meter);
    setEditingReading(reading);
    router.push('/register');
  };

  return (
    <Screen>
      <View className="relative overflow-hidden rounded-[32px] bg-brand-dark p-5">
        <View className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand" />
        <Text className="text-xs font-bold uppercase tracking-widest text-on-brand">
          Control de lecturas
        </Text>
        <Text className="mt-2 text-3xl font-extrabold uppercase tracking-wide text-white">
          Lecturas registradas
        </Text>
        <Text className="mt-2 text-sm font-semibold text-on-brand">
          Revisa el estado de cada lectura y sus verificaciones de campo
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
              showIcon
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
            showIcon
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
