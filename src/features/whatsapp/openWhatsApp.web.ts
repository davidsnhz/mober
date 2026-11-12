import { whatsappUrl } from './url';

/**
 * Web: abre wa.me en una pestaña nueva para no salir de Mober (en el móvil, el sistema lo
 * redirige a la app de WhatsApp). El mensaje nunca se envía solo.
 */
export async function openWhatsApp(phone: string | null, message: string): Promise<boolean> {
  const link = document.createElement('a');
  link.href = whatsappUrl(phone, message);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
  return true;
}
