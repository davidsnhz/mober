/**
 * Migraciones versionadas del esquema SQLite. Nunca se edita una migración publicada:
 * los cambios de esquema se añaden como una entrada nueva con la versión siguiente.
 */
export interface Migration {
  version: number;
  name: string;
  statements: readonly string[];
}

export const migrations: readonly Migration[] = [
  {
    version: 1,
    name: 'esquema inicial',
    statements: [
      `CREATE TABLE IF NOT EXISTS people (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        contact_id TEXT,
        created_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS debts (
        id TEXT PRIMARY KEY NOT NULL,
        person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
        amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
        concept TEXT,
        created_at INTEGER NOT NULL,
        paid_at INTEGER
      )`,
      `CREATE INDEX IF NOT EXISTS debts_person_idx ON debts(person_id)`,
      `CREATE INDEX IF NOT EXISTS debts_paid_idx ON debts(paid_at)`,
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      )`,
    ],
  },
];

export const LATEST_SCHEMA_VERSION = migrations[migrations.length - 1]?.version ?? 0;

/** Migraciones que faltan por aplicar a partir de una versión dada, en orden. */
export function pendingMigrations(currentVersion: number): Migration[] {
  return migrations
    .filter((migration) => migration.version > currentVersion)
    .sort((a, b) => a.version - b.version);
}
