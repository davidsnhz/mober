import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

import { ACTION_PAID, handlePaidAction } from './notifications';

/**
 * Tarea en segundo plano para el botón "Pagado": en Android se ejecuta aunque la app esté
 * cerrada, sin abrirla. Debe definirse al cargar el bundle, por eso se importa desde el punto de
 * entrada (`index.ts`). En iOS el mismo botón llega por el listener de respuestas.
 */
const TASK_NAME = 'MOBER_NOTIFICATION_ACTION';

TaskManager.defineTask<Notifications.NotificationTaskPayload>(
  TASK_NAME,
  async ({ data, error }) => {
    if (error || !data || !('actionIdentifier' in data)) return;
    if (data.actionIdentifier !== ACTION_PAID) return;
    await handlePaidAction(data);
  },
);

Notifications.registerTaskAsync(TASK_NAME).catch((error: unknown) => {
  // En Expo Go no se pueden registrar tareas en segundo plano; con un development build sí.
  console.warn('Notificaciones: no se pudo registrar la tarea en segundo plano', error);
});
