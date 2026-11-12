import * as Notifications from 'expo-notifications';
import type { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { openWhatsApp } from '@/features/whatsapp/openWhatsApp';
import { buildReminderMessage } from '@/features/whatsapp/templates';
import { selectPersonDebts } from '@/store/selectors';
import { useDataStore } from '@/store/useDataStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { palette } from '@/theme';

import { planNotifications, type PlannedNotification } from './planner';

type AppRouter = ReturnType<typeof useRouter>;

/**
 * Notificaciones locales en iOS y Android. Todo se programa en el propio dispositivo: no hay
 * servidor ni sale ningún dato del teléfono. La variante web (`notifications.web.ts`) expone
 * las mismas funciones sin efecto.
 */

const CHANNEL_ID = 'recordatorios';
export const ACTION_PAID = 'pagado';
export const ACTION_REMIND = 'recordar';
const SYNC_DEBOUNCE_MS = 400;

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unavailable';

interface NotificationData {
  personId: string | null;
  debtIds: string[];
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function logError(context: string) {
  return (error: unknown) => console.warn(`Notificaciones: ${context}`, error);
}

// ── Permisos ────────────────────────────────────────────────────────────────

function isGranted(status: Notifications.NotificationPermissionsStatus): boolean {
  return status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function getPermissionState(): Promise<PermissionState> {
  try {
    const status = await Notifications.getPermissionsAsync();
    if (isGranted(status)) return 'granted';
    return status.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'unavailable';
  }
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Recordatorios',
    description: 'Resumen de lo que te deben y avisos a los 7 y 30 días.',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: palette.green,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
}

/**
 * Pide permiso de notificaciones una sola vez, al guardar la primera deuda (nunca al abrir la
 * app). Después programa los avisos.
 */
export async function promptForNotificationsOnce(): Promise<void> {
  const { settings, update } = useSettingsStore.getState();
  if (settings.notificationsPrompted) return;
  await update({ notificationsPrompted: true });
  try {
    // En Android 13+ el sistema solo muestra el diálogo si ya existe un canal.
    await ensureChannel();
    const status = await Notifications.getPermissionsAsync();
    if (!isGranted(status) && status.canAskAgain) {
      await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowSound: true, allowBadge: false },
      });
    }
  } catch (error) {
    logError('no se pudo pedir permiso')(error);
  }
  await syncNotifications();
}

/** Estado del permiso para Ajustes; se refresca al volver a la app. */
export function useNotificationPermission(): PermissionState {
  const [state, setState] = useState<PermissionState>('undetermined');
  useEffect(() => {
    let active = true;
    const refresh = () => {
      void getPermissionState().then((next) => {
        if (active) setState(next);
      });
    };
    refresh();
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') refresh();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return state;
}

// ── Programación ────────────────────────────────────────────────────────────

/** Los identificadores de categoría no admiten ":" ni "-". */
function categoryId(personId: string): string {
  return `persona_${personId.replace(/[^a-zA-Z0-9]/g, '')}`;
}

async function applyPlan(plan: readonly PlannedNotification[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (plan.length === 0) return;
  await ensureChannel();

  // Una categoría por persona, porque el botón lleva su nombre: "Recordar a Lucía".
  const categories = new Map<string, string>();
  for (const item of plan) {
    if (item.personId && item.actionName)
      categories.set(categoryId(item.personId), item.actionName);
  }
  for (const [identifier, name] of categories) {
    await Notifications.setNotificationCategoryAsync(identifier, [
      {
        identifier: ACTION_PAID,
        buttonTitle: 'Pagado',
        options: { opensAppToForeground: false },
      },
      {
        identifier: ACTION_REMIND,
        buttonTitle: `Recordar a ${name}`,
        options: { opensAppToForeground: true },
      },
    ]);
  }

  for (const item of plan) {
    const data: NotificationData = { personId: item.personId, debtIds: item.debtIds };
    await Notifications.scheduleNotificationAsync({
      identifier: item.id,
      content: {
        title: item.title,
        body: item.body,
        data: { ...data },
        color: palette.green,
        ...(item.personId && item.actionName
          ? { categoryIdentifier: categoryId(item.personId) }
          : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: item.fireAt,
        channelId: CHANNEL_ID,
      },
    });
  }
}

async function runSync(): Promise<void> {
  const { status, people, debts } = useDataStore.getState();
  if (status !== 'ready') return;
  if ((await getPermissionState()) !== 'granted') {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }
  const { settings } = useSettingsStore.getState();
  await applyPlan(planNotifications({ people, debts, settings, now: Date.now() }));
}

let queue: Promise<void> = Promise.resolve();

/**
 * Cancela todo y vuelve a programar según los datos actuales. Las llamadas se encadenan para
 * que dos sincronizaciones nunca se pisen.
 */
export function syncNotifications(): Promise<void> {
  queue = queue.then(runSync).catch(logError('no se pudieron programar'));
  return queue;
}

/**
 * Mantiene las notificaciones al día: al arrancar, al volver a la app y cada vez que cambian
 * las deudas, las personas o los ajustes. Devuelve la función para dejar de escuchar.
 */
export function startNotificationSync(): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void syncNotifications(), SYNC_DEBOUNCE_MS);
  };

  const unsubscribeData = useDataStore.subscribe((state, previous) => {
    if (state.debts !== previous.debts || state.people !== previous.people) schedule();
  });
  const unsubscribeSettings = useSettingsStore.subscribe((state, previous) => {
    if (state.settings !== previous.settings) schedule();
  });
  const appState = AppState.addEventListener('change', (status) => {
    if (status === 'active') schedule();
  });

  void syncNotifications();

  return () => {
    if (timer) clearTimeout(timer);
    unsubscribeData();
    unsubscribeSettings();
    appState.remove();
  };
}

// ── Respuestas: tocar la notificación y sus botones ─────────────────────────

function readData(raw: unknown): NotificationData {
  const record = (raw ?? {}) as Record<string, unknown>;
  return {
    personId: typeof record.personId === 'string' ? record.personId : null,
    debtIds: Array.isArray(record.debtIds)
      ? record.debtIds.filter((id): id is string => typeof id === 'string')
      : [],
  };
}

async function ensureDataLoaded(): Promise<void> {
  if (useDataStore.getState().status !== 'ready') await useDataStore.getState().bootstrap();
}

const handledResponses = new Set<string>();

function responseKey(response: Notifications.NotificationResponse): string {
  const { request, date } = response.notification;
  return `${request.identifier}:${response.actionIdentifier}:${date}`;
}

/** Botón "Pagado": marca las deudas sin abrir la app y reprograma los avisos. */
export async function handlePaidAction(
  response: Notifications.NotificationResponse,
): Promise<void> {
  const key = responseKey(response);
  if (handledResponses.has(key)) return;
  handledResponses.add(key);

  const { debtIds } = readData(response.notification.request.content.data);
  await ensureDataLoaded();
  const pendingIds = new Set(
    useDataStore
      .getState()
      .debts.filter((debt) => debt.paidAt === null)
      .map((debt) => debt.id),
  );
  const ids = debtIds.filter((id) => pendingIds.has(id));
  if (ids.length > 0) await useDataStore.getState().markPaid(ids);

  await Notifications.dismissNotificationAsync(response.notification.request.identifier).catch(
    logError('no se pudo retirar el aviso'),
  );
  await syncNotifications();
}

async function handleResponse(
  response: Notifications.NotificationResponse,
  router: AppRouter,
): Promise<void> {
  if (response.actionIdentifier === ACTION_PAID) {
    await handlePaidAction(response);
    return;
  }

  const key = responseKey(response);
  if (handledResponses.has(key)) return;
  handledResponses.add(key);

  const { personId } = readData(response.notification.request.content.data);
  await ensureDataLoaded();
  const { people, debts } = useDataStore.getState();
  const person = personId ? people.find((candidate) => candidate.id === personId) : undefined;

  if (!person) {
    router.navigate('/');
    return;
  }

  if (response.actionIdentifier === ACTION_REMIND && person.phone) {
    const { pending } = selectPersonDebts(debts, person.id);
    if (pending.length > 0) {
      const { messageTone, customTemplate } = useSettingsStore.getState().settings;
      const message = buildReminderMessage({
        personName: person.name,
        debts: pending,
        tone: messageTone,
        customTemplate,
      });
      if (await openWhatsApp(person.phone, message)) return;
    }
  }

  // Tocar el aviso (o "Recordar" sin teléfono vinculado) abre el detalle de la persona.
  router.navigate({ pathname: '/persona/[id]', params: { id: person.id } });
}

/** Atiende las respuestas a notificaciones mientras la app está abierta o al abrirse por una. */
export function useNotificationResponses(router: AppRouter): void {
  useEffect(() => {
    const handle = (response: Notifications.NotificationResponse) => {
      handleResponse(response, router).catch(logError('no se pudo atender la respuesta'));
      Notifications.clearLastNotificationResponse();
    };

    const last = Notifications.getLastNotificationResponse();
    if (last) handle(last);

    const subscription = Notifications.addNotificationResponseReceivedListener(handle);
    return () => subscription.remove();
  }, [router]);
}
