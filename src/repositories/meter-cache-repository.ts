import { getDatabase } from '../database/database';
import type { Meter } from '../types/domain';

interface MeterCacheRow {
  codigo: string;
  direccion: string;
  sector: string;
  numero_cuenta: string;
  estado: string;
  ultima_lectura: number;
  fecha_ultima_lectura: string;
  consumo_promedio_mensual: number;
  consultado_en: string;
}

const toMeter = (row: MeterCacheRow): Meter => ({
  code: row.codigo,
  address: row.direccion,
  sector: row.sector,
  accountNumber: row.numero_cuenta,
  status: row.estado,
  previousReading: row.ultima_lectura,
  previousReadingDate: row.fecha_ultima_lectura,
  monthlyAverage: row.consumo_promedio_mensual,
});

export const findCachedMeter = async (code: string): Promise<(Meter & { cachedAt: string }) | null> => {
  const database = await getDatabase();
  const row = await database.getFirstAsync<MeterCacheRow>(
    'SELECT * FROM medidores_cache WHERE codigo = ?',
    code,
  );

  return row ? { ...toMeter(row), cachedAt: row.consultado_en } : null;
};

export const saveCachedMeter = async (meter: Meter, cachedAt: string): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO medidores_cache (
      codigo, direccion, sector, numero_cuenta, estado, ultima_lectura,
      fecha_ultima_lectura, consumo_promedio_mensual, consultado_en
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(codigo) DO UPDATE SET
      direccion = excluded.direccion,
      sector = excluded.sector,
      numero_cuenta = excluded.numero_cuenta,
      estado = excluded.estado,
      ultima_lectura = excluded.ultima_lectura,
      fecha_ultima_lectura = excluded.fecha_ultima_lectura,
      consumo_promedio_mensual = excluded.consumo_promedio_mensual,
      consultado_en = excluded.consultado_en`,
    meter.code,
    meter.address,
    meter.sector,
    meter.accountNumber,
    meter.status,
    meter.previousReading,
    meter.previousReadingDate,
    meter.monthlyAverage,
    cachedAt,
  );
};

export const updateCachedLastReading = async (
  code: string,
  reading: number,
  date: string,
): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE medidores_cache SET ultima_lectura = ?, fecha_ultima_lectura = ? WHERE codigo = ?',
    reading,
    date,
    code,
  );
};
