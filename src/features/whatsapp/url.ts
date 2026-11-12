/**
 * Enlace de WhatsApp con el mensaje ya escrito. Con teléfono abre el chat de esa persona
 * (wa.me/<número sin +>); sin teléfono, abre WhatsApp para elegir el chat.
 */
export function whatsappUrl(phone: string | null, message: string): string {
  const text = encodeURIComponent(message);
  const digits = phone ? phone.replace(/\D/g, '') : '';
  return digits === '' ? `https://wa.me/?text=${text}` : `https://wa.me/${digits}?text=${text}`;
}
