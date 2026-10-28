import { z } from 'zod';

import type { Reading } from '../types/domain';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

const remoteReadingSchema = z.object({
  clienteId: z.string().min(1),
  codigoMedidor: z.string().min(1),
  periodo: z.string().min(1),
  estadoMedidor: z.string().min(1),
  lectura: z.number().nullable(),
  consumo: z.number().nullable(),
  motivoDescripcion: z.string(),
  foto: z.string().nullable(),
  fechaRegistro: z.string().min(1),
});

const toRemoteReading = (reading: Reading) => ({
  clienteId: reading.id,
  codigoMedidor: reading.meterCode,
  periodo: reading.period,
  estadoMedidor: reading.meterStatus,
  lectura: reading.currentReading,
  consumo: reading.consumption,
  motivoDescripcion: reading.reason ?? reading.damageDescription ?? '',
  foto: reading.photoPath,
  fechaRegistro: reading.createdAt,
});

const ensureApiUrl = (): string => {
  if (!API_URL) {
    throw new Error('EXPO_PUBLIC_API_URL no está configurada.');
  }
  return API_URL;
};

export const findRemoteReadingByClientId = async (clientId: string): Promise<boolean> => {
  const response = await fetch(
    `${ensureApiUrl()}/lecturas?clienteId=${encodeURIComponent(clientId)}`,
  );
  if (!response.ok) {
    throw new Error(`No se pudo verificar la lectura (${response.status}).`);
  }

  const payload = z.array(remoteReadingSchema).parse(await response.json());
  return payload.some((reading) => reading.clienteId === clientId);
};

export const sendReading = async (reading: Reading): Promise<void> => {
  const response = await fetch(`${ensureApiUrl()}/lecturas`, {
    body: JSON.stringify(toRemoteReading(reading)),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`No se pudo enviar la lectura (${response.status}).`);
  }

  remoteReadingSchema.parse(await response.json());
};
