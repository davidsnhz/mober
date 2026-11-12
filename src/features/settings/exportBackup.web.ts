import type { Snapshot } from '@/db/types';

import { backupFileName, buildBackup } from './backup';

/** Web: descarga la copia como archivo JSON. */
export async function exportBackup(snapshot: Snapshot): Promise<boolean> {
  const now = new Date();
  const json = JSON.stringify(buildBackup(snapshot, now), null, 2);
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));

  const link = document.createElement('a');
  link.href = url;
  link.download = backupFileName(now);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
