export type PickContactResult =
  /** Contacto elegido, con sus teléfonos válidos en formato E.164 (puede no tener ninguno). */
  | { status: 'picked'; contactId: string; phones: string[] }
  | { status: 'cancelled' }
  /** El sistema pidió permiso para leer el contacto y se denegó. */
  | { status: 'denied' }
  /** La plataforma no tiene selector de contactos (web). */
  | { status: 'unavailable' }
  | { status: 'error' };

/** Nota para todo lo que solo existe en la app nativa. */
export const NATIVE_ONLY_NOTE = 'Disponible en la app de iOS y Android';
