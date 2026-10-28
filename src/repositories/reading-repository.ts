import { getDatabase } from '../database/database';
import type { Reading, SyncStatus } from '../types/domain';

interface ReadingRow {
  id: string;
  medidor_codigo: string;
  periodo: string;
  estado_medidor: Reading['meterStatus'];
  lectura_actual: number | null;
  lectura_anterior: number | null;
  consumo: number | null;
  motivo: string | null;
  descripcion_dano: string | null;
  ruta_foto: string | null;
  estado_envio: SyncStatus;
  pendiente_verificar: number;
  creado_en: string;
  actualizado_en: string;
}

const toReading = (row: ReadingRow): Reading => ({
  id: row.id,
  meterCode: row.medidor_codigo,
  period: row.periodo,
  meterStatus: row.estado_medidor,
  currentReading: row.lectura_actual,
  previousReading: row.lectura_anterior,
  consumption: row.consumo,
  reason: row.motivo,
  damageDescription: row.descripcion_dano,
  photoPath: row.ruta_foto,
  syncStatus: row.estado_envio,
  verificationPending: row.pendiente_verificar === 1,
  createdAt: row.creado_en,
  updatedAt: row.actualizado_en,
});

export const saveReading = async (reading: Reading): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO lecturas (
      id, medidor_codigo, periodo, estado_medidor, lectura_actual,
      lectura_anterior, consumo, motivo, descripcion_dano, ruta_foto,
      estado_envio, pendiente_verificar, creado_en, actualizado_en
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    reading.id,
    reading.meterCode,
    reading.period,
    reading.meterStatus,
    reading.currentReading,
    reading.previousReading,
    reading.consumption,
    reading.reason,
    reading.damageDescription,
    reading.photoPath,
    reading.syncStatus,
    reading.verificationPending ? 1 : 0,
    reading.createdAt,
    reading.updatedAt,
  );
};

export const findReadingById = async (id: string): Promise<Reading | null> => {
  const database = await getDatabase();
  const row = await database.getFirstAsync<ReadingRow>(
    'SELECT * FROM lecturas WHERE id = ?',
    id,
  );
  return row ? toReading(row) : null;
};

export const findReadingByMeterAndPeriod = async (
  meterCode: string,
  period: string,
): Promise<Reading | null> => {
  const database = await getDatabase();
  const row = await database.getFirstAsync<ReadingRow>(
    'SELECT * FROM lecturas WHERE medidor_codigo = ? AND periodo = ?',
    meterCode,
    period,
  );
  return row ? toReading(row) : null;
};

export const findPendingReadings = async (): Promise<Reading[]> => {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ReadingRow>(
    `SELECT * FROM lecturas
     WHERE estado_envio = 'pendiente'
     ORDER BY creado_en ASC`,
  );
  return rows.map(toReading);
};

export const countPendingReadings = async (): Promise<number> => {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total FROM lecturas WHERE estado_envio = 'pendiente'`,
  );
  return row?.total ?? 0;
};

export const markReadingAsSent = async (id: string, updatedAt: string): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE lecturas
     SET estado_envio = 'enviada', pendiente_verificar = 0, actualizado_en = ?
     WHERE id = ? AND estado_envio = 'pendiente'`,
    updatedAt,
    id,
  );
};
