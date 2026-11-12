import { Contact, ContactField, requestPermissionsAsync } from 'expo-contacts';

import { toE164 } from '@/lib/phone';

import type { PickContactResult } from './types';

/** En iOS y Android se puede vincular un contacto con el selector del sistema. */
export const contactsAvailable = true;

async function readPhones(contact: Contact): Promise<string[]> {
  const details = await contact.getDetails([ContactField.PHONES]);
  const phones = new Set<string>();
  for (const phone of details.phones ?? []) {
    const normalized = phone.number ? toE164(phone.number) : null;
    if (normalized) phones.add(normalized);
  }
  return [...phones];
}

/**
 * Abre el selector de contactos del sistema y devuelve solo el contacto elegido. Mober nunca
 * lista ni lee el resto de la agenda.
 */
export async function pickContact(): Promise<PickContactResult> {
  let contact: Contact | null;
  try {
    contact = await Contact.presentPicker();
  } catch (error) {
    console.warn('No se pudo abrir el selector de contactos', error);
    return { status: 'error' };
  }
  if (!contact) return { status: 'cancelled' };

  try {
    return { status: 'picked', contactId: contact.id, phones: await readPhones(contact) };
  } catch {
    // Algunos sistemas exigen permiso para leer el teléfono del contacto elegido.
    try {
      const permission = await requestPermissionsAsync();
      if (!permission.granted) return { status: 'denied' };
      return { status: 'picked', contactId: contact.id, phones: await readPhones(contact) };
    } catch (error) {
      console.warn('No se pudo leer el contacto elegido', error);
      return { status: 'error' };
    }
  }
}
