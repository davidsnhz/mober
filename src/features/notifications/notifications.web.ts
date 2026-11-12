import type { useRouter } from 'expo-router';

type AppRouter = ReturnType<typeof useRouter>;

/**
 * Web: las notificaciones locales programadas no existen en el navegador. Mismas funciones que
 * en iOS y Android, sin efecto, para que el resto de la app no tenga que distinguir.
 */

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export const ACTION_PAID = 'pagado';
export const ACTION_REMIND = 'recordar';

export async function getPermissionState(): Promise<PermissionState> {
  return 'unavailable';
}

export async function promptForNotificationsOnce(): Promise<void> {}

export function useNotificationPermission(): PermissionState {
  return 'unavailable';
}

export async function syncNotifications(): Promise<void> {}

export function startNotificationSync(): () => void {
  return () => {};
}

export async function handlePaidAction(): Promise<void> {}

export function useNotificationResponses(_router: AppRouter): void {}
