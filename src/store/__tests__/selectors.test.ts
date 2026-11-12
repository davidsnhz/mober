import type { Debt, Person } from '@/db/types';

import {
  computeTotals,
  countPaid,
  findPersonByName,
  selectPersonDebts,
  suggestPeople,
  summarizePeople,
} from '../selectors';

const person = (id: string, name: string): Person => ({
  id,
  name,
  phone: null,
  contactId: null,
  createdAt: 0,
});

const debt = (
  id: string,
  personId: string,
  amountCents: number,
  createdAt: number,
  paidAt: number | null = null,
): Debt => ({ id, personId, amountCents, concept: null, createdAt, paidAt });

const people = [
  person('p', 'Pedro Martín'),
  person('l', 'Lucía Sanz'),
  person('x', 'Paula Ortega'),
];
const debts = [
  debt('1', 'p', 2000, 300),
  debt('2', 'p', 1250, 500),
  debt('3', 'l', 1500, 100),
  debt('4', 'l', 900, 50, 200),
  debt('5', 'x', 700, 10, 20),
];

describe('lista de Inicio', () => {
  it('agrupa por persona, suma en céntimos y ordena por la deuda más antigua', () => {
    const summaries = summarizePeople(people, debts);
    expect(summaries.map((summary) => summary.person.id)).toEqual(['l', 'p']);
    expect(summaries[1]?.totalCents).toBe(3250);
    expect(summaries[1]?.pending.map((item) => item.id)).toEqual(['1', '2']);
  });

  it('no incluye a quien ya lo ha pagado todo', () => {
    expect(summarizePeople(people, debts).some((summary) => summary.person.id === 'x')).toBe(false);
  });

  it('calcula el total, las personas y las deudas', () => {
    expect(computeTotals(summarizePeople(people, debts))).toEqual({
      totalCents: 4750,
      peopleCount: 2,
      debtCount: 3,
    });
    expect(countPaid(debts)).toBe(2);
  });
});

describe('detalle de persona', () => {
  it('separa pendientes y pagadas', () => {
    const result = selectPersonDebts(debts, 'l');
    expect(result.pending.map((item) => item.id)).toEqual(['3']);
    expect(result.paid.map((item) => item.id)).toEqual(['4']);
    expect(result.totalCents).toBe(1500);
  });
});

describe('autocompletado de nombres', () => {
  it('no distingue mayúsculas ni acentos', () => {
    expect(findPersonByName(people, 'lucia sanz')?.id).toBe('l');
    expect(findPersonByName(people, '  PEDRO   MARTIN ')?.id).toBe('p');
    expect(findPersonByName(people, 'Pedro')).toBeUndefined();
    expect(findPersonByName(people, '')).toBeUndefined();
  });

  it('sugiere por prefijo, también del apellido', () => {
    expect(suggestPeople(people, debts, 'p').map((item) => item.id)).toEqual(['p', 'x']);
    expect(suggestPeople(people, debts, 'sanz').map((item) => item.id)).toEqual(['l']);
    expect(suggestPeople(people, debts, 'LUCÍ').map((item) => item.id)).toEqual(['l']);
    expect(suggestPeople(people, debts, 'zzz')).toEqual([]);
  });

  it('sin texto propone a las personas usadas más recientemente', () => {
    expect(suggestPeople(people, debts, '', 2).map((item) => item.id)).toEqual(['p', 'l']);
  });
});
