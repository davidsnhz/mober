import type { Snapshot } from '@/db/types';

export interface Backup extends Snapshot {
  app: 'Mober';
  /** Versión del formato de la copia. */
  formatVersion: 1;
  exportedAt: string;
}

/** Contenido de "Exportar copia": todos los datos en un JSON legible. */
export function buildBackup(snapshot: Snapshot, now: Date): Backup {
  return {
    app: 'Mober',
    formatVersion: 1,
    exportedAt: now.toISOString(),
    people: snapshot.people,
    debts: snapshot.debts,
    settings: snapshot.settings,
  };
}

/** "mober-copia-2026-11-12.json". */
export function backupFileName(now: Date): string {
  const day = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  return `mober-copia-${day}.json`;
}
