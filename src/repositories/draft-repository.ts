import { getDatabase } from '../database/database';
import type { Draft } from '../types/domain';

export const findDraftByEmployee = async (employeeCode: string): Promise<Draft | null> => {
  const database = await getDatabase();
  return database.getFirstAsync<Draft>(
    `SELECT
      codigo_empleado AS employeeCode,
      medidor_codigo AS meterCode,
      paso_actual AS currentStep,
      datos_json AS payloadJson,
      ruta_foto AS photoPath,
      actualizado_en AS updatedAt
    FROM borradores
    WHERE codigo_empleado = ?`,
    employeeCode,
  );
};

export const saveDraft = async (draft: Draft): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO borradores (
      codigo_empleado, medidor_codigo, paso_actual, datos_json, ruta_foto, actualizado_en
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(codigo_empleado) DO UPDATE SET
      medidor_codigo = excluded.medidor_codigo,
      paso_actual = excluded.paso_actual,
      datos_json = excluded.datos_json,
      ruta_foto = excluded.ruta_foto,
      actualizado_en = excluded.actualizado_en`,
    draft.employeeCode,
    draft.meterCode,
    draft.currentStep,
    draft.payloadJson,
    draft.photoPath,
    draft.updatedAt,
  );
};

export const deleteDraft = async (employeeCode: string): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    'DELETE FROM borradores WHERE codigo_empleado = ?',
    employeeCode,
  );
};
