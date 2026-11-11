import type { Debt, Person } from '@/db/types';
import { sumCents } from '@/lib/money';
import { normalize } from '@/lib/text';

export interface PersonSummary {
  person: Person;
  /** Deudas pendientes, de la más antigua a la más reciente. */
  pending: Debt[];
  totalCents: number;
  /** Fecha de la deuda pendiente más antigua. */
  oldestAt: number;
}

export interface Totals {
  totalCents: number;
  peopleCount: number;
  debtCount: number;
}

/** Una fila por persona con deudas pendientes, las más antiguas primero. */
export function summarizePeople(
  people: readonly Person[],
  debts: readonly Debt[],
): PersonSummary[] {
  const pendingByPerson = new Map<string, Debt[]>();
  for (const debt of debts) {
    if (debt.paidAt !== null) continue;
    const list = pendingByPerson.get(debt.personId);
    if (list) list.push(debt);
    else pendingByPerson.set(debt.personId, [debt]);
  }

  const summaries: PersonSummary[] = [];
  for (const person of people) {
    const pending = pendingByPerson.get(person.id);
    const oldest = pending?.reduce((min, debt) => Math.min(min, debt.createdAt), Infinity);
    if (!pending || oldest === undefined) continue;
    summaries.push({
      person,
      pending: [...pending].sort((a, b) => a.createdAt - b.createdAt),
      totalCents: sumCents(pending.map((debt) => debt.amountCents)),
      oldestAt: oldest,
    });
  }
  return summaries.sort(
    (a, b) => a.oldestAt - b.oldestAt || a.person.name.localeCompare(b.person.name),
  );
}

export function computeTotals(summaries: readonly PersonSummary[]): Totals {
  return {
    totalCents: sumCents(summaries.map((summary) => summary.totalCents)),
    peopleCount: summaries.length,
    debtCount: sumCents(summaries.map((summary) => summary.pending.length)),
  };
}

export function countPaid(debts: readonly Debt[]): number {
  return debts.filter((debt) => debt.paidAt !== null).length;
}

export interface PersonDebts {
  /** Pendientes, de la más antigua a la más reciente. */
  pending: Debt[];
  /** Pagadas, la cobrada más recientemente primero. */
  paid: Debt[];
  totalCents: number;
}

export function selectPersonDebts(debts: readonly Debt[], personId: string): PersonDebts {
  const own = debts.filter((debt) => debt.personId === personId);
  const pending = own
    .filter((debt) => debt.paidAt === null)
    .sort((a, b) => a.createdAt - b.createdAt);
  const paid = own
    .filter((debt) => debt.paidAt !== null)
    .sort((a, b) => (b.paidAt ?? 0) - (a.paidAt ?? 0));
  return { pending, paid, totalCents: sumCents(pending.map((debt) => debt.amountCents)) };
}

/** Persona cuyo nombre coincide sin distinguir mayúsculas ni acentos. */
export function findPersonByName(people: readonly Person[], name: string): Person | undefined {
  const target = normalize(name);
  if (target === '') return undefined;
  return people.find((person) => normalize(person.name) === target);
}

/**
 * Sugerencias para el campo "¿Quién?": primero los nombres que empiezan por lo escrito, luego
 * los que lo contienen; a igualdad, quien tiene la deuda más reciente.
 */
export function suggestPeople(
  people: readonly Person[],
  debts: readonly Debt[],
  query: string,
  limit = 4,
): Person[] {
  const lastUse = new Map<string, number>();
  for (const debt of debts) {
    lastUse.set(debt.personId, Math.max(lastUse.get(debt.personId) ?? 0, debt.createdAt));
  }
  const recency = (person: Person) => lastUse.get(person.id) ?? person.createdAt;
  const needle = normalize(query);

  const ranked = people
    .map((person) => {
      const name = normalize(person.name);
      const words = name.split(' ');
      let rank = 3;
      if (needle === '') rank = 2;
      else if (name.startsWith(needle)) rank = 0;
      else if (words.some((word) => word.startsWith(needle))) rank = 1;
      else if (name.includes(needle)) rank = 2;
      return { person, rank };
    })
    .filter((entry) => entry.rank < 3)
    .sort((a, b) => a.rank - b.rank || recency(b.person) - recency(a.person));

  return ranked.slice(0, limit).map((entry) => entry.person);
}
