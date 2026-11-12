import type { PickContactResult } from './types';

/** En web no hay selector de contactos del sistema. */
export const contactsAvailable = false;

export async function pickContact(): Promise<PickContactResult> {
  return { status: 'unavailable' };
}
