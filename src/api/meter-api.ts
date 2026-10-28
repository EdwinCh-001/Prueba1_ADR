import { meterSchema } from '../types/schemas';
import type { Meter } from '../types/domain';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const REQUEST_TIMEOUT_MS = 10_000;

const remoteMeterSchema = meterSchema
  .omit({
    code: true,
    address: true,
    accountNumber: true,
    status: true,
    previousReading: true,
    previousReadingDate: true,
    monthlyAverage: true,
  })
  .extend({
    codigo: meterSchema.shape.code,
    direccion: meterSchema.shape.address,
    estado: meterSchema.shape.status,
    numeroCuenta: meterSchema.shape.accountNumber,
    ultimaLectura: meterSchema.shape.previousReading,
    fechaUltimaLectura: meterSchema.shape.previousReadingDate,
    consumoPromedioMensual: meterSchema.shape.monthlyAverage,
  });

const remoteMetersSchema = remoteMeterSchema.array();

const toMeter = (remoteMeter: {
  codigo: string;
  direccion: string;
  sector: string;
  numeroCuenta: string;
  estado: string;
  ultimaLectura: number;
  fechaUltimaLectura: string;
  consumoPromedioMensual: number;
}): Meter => ({
  code: remoteMeter.codigo,
  address: remoteMeter.direccion,
  sector: remoteMeter.sector,
  accountNumber: remoteMeter.numeroCuenta,
  status: remoteMeter.estado,
  previousReading: remoteMeter.ultimaLectura,
  previousReadingDate: remoteMeter.fechaUltimaLectura,
  monthlyAverage: remoteMeter.consumoPromedioMensual,
});

export const fetchMeter = async (code: string, signal?: AbortSignal): Promise<Meter> => {
  if (!API_URL) {
    throw new Error('EXPO_PUBLIC_API_URL no está configurada.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const abortRequest = (): void => controller.abort();
  signal?.addEventListener('abort', abortRequest, { once: true });

  try {
    const response = await fetch(
      `${API_URL}/medidores?codigo=${encodeURIComponent(code)}`,
      { signal: controller.signal },
    );

    if (!response.ok) {
      throw new Error(`La consulta del medidor falló (${response.status}).`);
    }

    const parsedResponse = remoteMetersSchema.parse(await response.json());
      const remoteMeter = parsedResponse[0];
    if (!remoteMeter) {
      throw new Error('No se encontró un medidor con ese código.');
    }

    return toMeter(remoteMeter);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abortRequest);
  }
};
