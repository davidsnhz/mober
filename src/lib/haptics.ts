import * as Haptics from 'expo-haptics';

function ignore(): void {
  // La vibración es un extra: si el dispositivo no la soporta, no pasa nada.
}

/** Toque muy suave: teclas del teclado numérico y selecciones. */
export function hapticTap(): void {
  Haptics.selectionAsync().catch(ignore);
}

/** Confirmación: al guardar una deuda o marcarla como pagada. */
export function hapticSuccess(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignore);
}

/** Aviso antes de una acción destructiva. */
export function hapticWarning(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(ignore);
}
