import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { Snapshot } from '@/db/types';

import { backupFileName, buildBackup } from './backup';

/** Escribe la copia en la caché de la app y abre la hoja de compartir del sistema. */
export async function exportBackup(snapshot: Snapshot): Promise<boolean> {
  const now = new Date();
  const file = new File(Paths.cache, backupFileName(now));
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(buildBackup(snapshot, now), null, 2));

  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Exportar copia de Mober',
  });
  return true;
}
