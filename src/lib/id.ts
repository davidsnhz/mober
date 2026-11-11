import * as Crypto from 'expo-crypto';

/** Identificador único para personas y deudas. */
export function newId(): string {
  return Crypto.randomUUID();
}
