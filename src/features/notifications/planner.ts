import type { Debt, Person } from '@/db/types';
import { addDays, atTime, DAY_MS, startOfDay } from '@/lib/dates';
import { formatMoneyCompact, sumCents } from '@/lib/money';
import { firstName, plural } from '@/lib/text';
import { summarizePeople, type PersonSummary } from '@/store/selectors';
import type { Settings } from '@/store/settings';

/**
 * Lógica pura que decide qué notificaciones locales programar. No toca el sistema: recibe los
 * datos y devuelve la lista, de modo que se puede probar entera con Jest.
 *
 * Reglas:
 * - Como máximo una notificación al día; si coinciden varias, se agrupan en una.
 * - El contenido de una notificación programada es fijo, así que se calcula con los datos de
 *   ahora y se vuelve a programar todo cada vez que cambian los datos o los ajustes.
 * - Nunca más de MAX_SCHEDULED (iOS admite 64 notificaciones pendientes).
 */

export const MAX_SCHEDULED = 60;
/** Días que debe cumplir una deuda para avisar por antigüedad. */
export const AGE_ALERT_DAYS = [7, 30] as const;
/** Hasta dónde se programan resúmenes. Al abrir la app se vuelve a programar todo. */
const SUMMARY_HORIZON_DAYS = 180;
const MAX_NAMES = 3;

/** Lunes 1 de enero de 2024: origen fijo para que "cada 3 días" y "quincenal" no se muevan. */
const CADENCE_EPOCH = new Date(2024, 0, 1).getTime();

export type PlannedKind = 'summary' | 'age';

export interface PlannedNotification {
  /** Identificador estable: un aviso por día ("mober_20261115"). */
  id: string;
  fireAt: number;
  title: string;
  body: string;
  kind: PlannedKind;
  /** Persona a la que se refiere, si es una sola: al tocar se abre su detalle. */
  personId: string | null;
  /** Nombre de pila para el botón "Recordar a {nombre}"; null si no lleva botones. */
  actionName: string | null;
  /** Deudas que marca el botón "Pagado"; vacío si no lleva botones. */
  debtIds: string[];
}

export interface PlannerInput {
  people: readonly Person[];
  debts: readonly Debt[];
  settings: Pick<
    Settings,
    | 'summaryFrequency'
    | 'summaryWeekday'
    | 'summaryHour'
    | 'summaryMinute'
    | 'ageAlerts'
    | 'hideAmounts'
  >;
  now: number;
}

function dayIndex(timestamp: number): number {
  return Math.round((startOfDay(timestamp) - startOfDay(CADENCE_EPOCH)) / DAY_MS);
}

function dayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}${month}${day}`;
}

/** ¿Toca resumen el día indicado, según la frecuencia elegida? */
export function isSummaryDay(timestamp: number, settings: PlannerInput['settings']): boolean {
  const index = dayIndex(timestamp);
  const weekday = new Date(timestamp).getDay();
  switch (settings.summaryFrequency) {
    case 'every3days':
      return ((index % 3) + 3) % 3 === 0;
    case 'weekly':
      return weekday === settings.summaryWeekday;
    case 'biweekly':
      return weekday === settings.summaryWeekday && Math.floor(index / 7) % 2 === 0;
    case 'never':
      return false;
  }
}

/** "Marta 60 €, Pedro 32,50 €, Carlos 27,50 € y 2 personas más." (máximo 3 nombres). */
export function describePeople(summaries: readonly PersonSummary[]): string {
  const ranked = [...summaries].sort(
    (a, b) => b.totalCents - a.totalCents || a.oldestAt - b.oldestAt,
  );
  const shown = ranked
    .slice(0, MAX_NAMES)
    .map((entry) => `${firstName(entry.person.name)} ${formatMoneyCompact(entry.totalCents)}`);
  const rest = ranked.length - shown.length;

  if (rest > 0) {
    return `${shown.join(', ')} y ${plural(rest, 'persona', 'personas')} más.`;
  }
  const last = shown.pop();
  if (last === undefined) return '';
  return shown.length === 0 ? `${last}.` : `${shown.join(', ')} y ${last}.`;
}

function ageLabel(days: number): string {
  return days >= 30 ? 'desde hace un mes' : 'desde hace una semana';
}

interface AgeEvent {
  debt: Debt;
  days: number;
}

interface Content {
  title: string;
  body: string;
  personId: string | null;
  actionName: string | null;
  debtIds: string[];
}

function hiddenContent(summaries: readonly PersonSummary[], personId: string | null): Content {
  const count = summaries.length;
  return {
    title: count === 1 ? 'Tienes 1 cobro pendiente' : `Tienes ${count} cobros pendientes`,
    body: 'Abre Mober para verlos.',
    personId,
    actionName: null,
    debtIds: [],
  };
}

function summaryContent(summaries: readonly PersonSummary[]): Content {
  const only = summaries.length === 1 ? summaries[0] : undefined;
  if (only) {
    const single = only.pending.length === 1 ? only.pending[0] : undefined;
    return {
      title: `${firstName(only.person.name)} te debe ${formatMoneyCompact(only.totalCents)}`,
      body: single
        ? (single.concept ?? 'Toca para recordárselo.')
        : `${plural(only.pending.length, 'deuda pendiente', 'deudas pendientes')}.`,
      personId: only.person.id,
      actionName: firstName(only.person.name),
      debtIds: only.pending.map((debt) => debt.id),
    };
  }
  const total = sumCents(summaries.map((summary) => summary.totalCents));
  return {
    title: `Te deben ${formatMoneyCompact(total)}`,
    body: describePeople(summaries),
    personId: null,
    actionName: null,
    debtIds: [],
  };
}

function ageContent(events: readonly AgeEvent[], people: ReadonlyMap<string, Person>): Content {
  const personIds = new Set(events.map((event) => event.debt.personId));
  const total = sumCents(events.map((event) => event.debt.amountCents));
  const sameAge = events.every((event) => event.days === events[0]?.days);
  const since = sameAge && events[0] ? ` ${ageLabel(events[0].days)}` : '';

  const [onlyPersonId] = personIds;
  if (personIds.size === 1 && onlyPersonId !== undefined) {
    const name = firstName(people.get(onlyPersonId)?.name ?? '');
    const concepts = events
      .map((event) => event.debt.concept)
      .filter((concept): concept is string => concept !== null);
    return {
      title: `${name} te debe ${formatMoneyCompact(total)}${since}`,
      body:
        concepts.length > 0
          ? concepts.join(', ')
          : events.length === 1
            ? 'Toca para recordárselo.'
            : `${events.length} deudas pendientes.`,
      personId: onlyPersonId,
      actionName: name,
      debtIds: events.map((event) => event.debt.id),
    };
  }

  // Varias personas el mismo día: un único aviso con el reparto.
  const perPerson = new Map<string, number>();
  for (const event of events) {
    perPerson.set(
      event.debt.personId,
      (perPerson.get(event.debt.personId) ?? 0) + event.debt.amountCents,
    );
  }
  const names = [...perPerson.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, cents]) => `${firstName(people.get(id)?.name ?? '')} ${formatMoneyCompact(cents)}`);
  const shown = names.slice(0, MAX_NAMES);
  const rest = names.length - shown.length;
  const last = rest > 0 ? `${plural(rest, 'persona', 'personas')} más` : shown.pop();

  return {
    title: `${plural(events.length, 'deuda sigue pendiente', 'deudas siguen pendientes')}${since}`,
    body: `${shown.join(', ')} y ${last ?? ''}.`,
    personId: null,
    actionName: null,
    debtIds: [],
  };
}

/** Calcula todas las notificaciones que deben estar programadas ahora mismo. */
export function planNotifications({
  people,
  debts,
  settings,
  now,
}: PlannerInput): PlannedNotification[] {
  const summaries = summarizePeople(people, debts);
  // Sin deudas pendientes no hay nada que recordar: se cancela todo.
  if (summaries.length === 0) return [];

  const peopleById = new Map(people.map((person) => [person.id, person]));
  const fireTime = (day: number) => atTime(day, settings.summaryHour, settings.summaryMinute);

  // 1. Avisos por antigüedad, agrupados por día.
  const ageByDay = new Map<string, AgeEvent[]>();
  if (settings.ageAlerts) {
    for (const summary of summaries) {
      for (const debt of summary.pending) {
        for (const days of AGE_ALERT_DAYS) {
          const fireAt = fireTime(addDays(debt.createdAt, days));
          if (fireAt <= now) continue;
          const key = dayKey(fireAt);
          const list = ageByDay.get(key);
          if (list) list.push({ debt, days });
          else ageByDay.set(key, [{ debt, days }]);
        }
      }
    }
  }

  // 2. Días de resumen dentro del horizonte.
  const summaryDays = new Map<string, number>();
  if (settings.summaryFrequency !== 'never') {
    for (let offset = 0; offset <= SUMMARY_HORIZON_DAYS; offset++) {
      const fireAt = fireTime(addDays(now, offset));
      if (fireAt > now && isSummaryDay(fireAt, settings)) summaryDays.set(dayKey(fireAt), fireAt);
    }
  }

  // 3. Un aviso por día: el resumen absorbe los avisos por antigüedad de ese mismo día.
  const planned: PlannedNotification[] = [];
  const onlyPersonId = summaries.length === 1 ? (summaries[0]?.person.id ?? null) : null;

  for (const [key, fireAt] of summaryDays) {
    const content = settings.hideAmounts
      ? hiddenContent(summaries, onlyPersonId)
      : summaryContent(summaries);
    planned.push({ id: `mober_${key}`, fireAt, kind: 'summary', ...content });
  }

  for (const [key, events] of ageByDay) {
    if (summaryDays.has(key)) continue;
    const first = events[0];
    if (!first) continue;
    const eventPeople = new Set(events.map((event) => event.debt.personId));
    const content = settings.hideAmounts
      ? hiddenContent(summaries, eventPeople.size === 1 ? first.debt.personId : null)
      : ageContent(events, peopleById);
    planned.push({
      id: `mober_${key}`,
      fireAt: fireTime(addDays(first.debt.createdAt, first.days)),
      kind: 'age',
      ...content,
    });
  }

  return planned.sort((a, b) => a.fireAt - b.fireAt).slice(0, MAX_SCHEDULED);
}
