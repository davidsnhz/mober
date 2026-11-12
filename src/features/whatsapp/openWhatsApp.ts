import * as Linking from 'expo-linking';

import { whatsappUrl } from './url';

/**
 * Abre WhatsApp con el mensaje escrito pero sin enviar: siempre lo revisa y lo manda la persona.
 * Devuelve false si no se pudo abrir.
 */
export async function openWhatsApp(phone: string | null, message: string): Promise<boolean> {
  try {
    await Linking.openURL(whatsappUrl(phone, message));
    return true;
  } catch (error) {
    console.warn('No se pudo abrir WhatsApp', error);
    return false;
  }
}
