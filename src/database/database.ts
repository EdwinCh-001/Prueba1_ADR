import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'epmaps.db';
const SCHEMA_VERSION = 2;

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

const createSchema = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS medidores_cache (
      codigo TEXT PRIMARY KEY NOT NULL,
      direccion TEXT NOT NULL,
      sector TEXT NOT NULL,
      numero_cuenta TEXT NOT NULL,
      estado TEXT NOT NULL,
      ultima_lectura REAL NOT NULL,
      fecha_ultima_lectura TEXT NOT NULL,
      consumo_promedio_mensual REAL NOT NULL,
      consultado_en TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lecturas (
      id TEXT PRIMARY KEY NOT NULL,
      medidor_codigo TEXT NOT NULL,
      periodo TEXT NOT NULL,
      estado_medidor TEXT NOT NULL,
      lectura_actual REAL,
      lectura_anterior REAL,
      consumo REAL,
      motivo TEXT,
      descripcion_dano TEXT,
      ruta_foto TEXT,
      estado_envio TEXT NOT NULL CHECK (estado_envio IN ('pendiente', 'enviada')),
      pendiente_verificar INTEGER NOT NULL DEFAULT 0,
      estado_verificacion TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (estado_verificacion IN ('pendiente', 'verificada', 'inconsistente')),
      creado_en TEXT NOT NULL,
      actualizado_en TEXT NOT NULL,
      UNIQUE (medidor_codigo, periodo)
    );

    CREATE INDEX IF NOT EXISTS idx_lecturas_estado_envio
      ON lecturas (estado_envio, creado_en);

    CREATE TABLE IF NOT EXISTS borradores (
      codigo_empleado TEXT PRIMARY KEY NOT NULL,
      medidor_codigo TEXT,
      paso_actual TEXT NOT NULL,
      datos_json TEXT NOT NULL,
      ruta_foto TEXT,
      actualizado_en TEXT NOT NULL
    );
  `);

  const versionRow = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version',
  );
  const verificationColumn = await database.getFirstAsync<{ name: string }>(
    `SELECT name FROM pragma_table_info('lecturas') WHERE name = 'estado_verificacion'`,
  );
  if ((versionRow?.user_version ?? 0) < 2 && !verificationColumn) {
    await database.execAsync(`
      ALTER TABLE lecturas ADD COLUMN estado_verificacion TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (estado_verificacion IN ('pendiente', 'verificada', 'inconsistente'));
    `);
  }
  if ((versionRow?.user_version ?? 0) < SCHEMA_VERSION) {
    await database.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }
};

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (database) => {
      await createSchema(database);
      return database;
    });
  }

  return databasePromise;
};
