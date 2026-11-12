import type { Debt, Person } from '@/db/types';
import { defaultSettings, type Settings } from '@/store/settings';

import { describePeople, isSummaryDay, MAX_SCHEDULED, planNotifications } from '../planner';

const DAY = 24 * 60 * 60 * 1000;

/** Jueves 12 de noviembre de 2026, 10:00 (hora local). */
const NOW = new Date(2026, 10, 12, 10, 0).getTime();

function at(year: number, month: number, day: number, hour = 19, minute = 0): number {
  return new Date(year, month - 1, day, hour, minute).getTime();
}

function person(id: string, name: string): Person {
  return { id, name, phone: null, contactId: null, createdAt: NOW - 60 * DAY };
}

function debt(
  id: string,
  personId: string,
  amountCents: number,
  concept: string | null,
  daysAgo: number,
  paid = false,
): Debt {
  return {
    id,
    personId,
    amountCents,
    concept,
    createdAt: NOW - daysAgo * DAY,
    paidAt: paid ? NOW - DAY : null,
  };
}

const people: Person[] = [
  person('marta', 'Marta Ruiz'),
  person('pedro', 'Pedro Martín'),
  person('carlos', 'Carlos Gil'),
  person('lucia', 'Lucía Sanz'),
  person('javi', 'Javi López'),
];

/** Los datos del diseño: 147,50 € entre 5 personas y 8 deudas. */
const debts: Debt[] = [
  debt('d1', 'marta', 2500, 'Cena cumpleaños', 34),
  debt('d2', 'marta', 2000, 'Gasolina', 33),
  debt('d3', 'marta', 1500, null, 32),
  debt('d4', 'pedro', 2000, 'Cena del sábado', 12),
  debt('d5', 'pedro', 1250, 'Cine', 9),
  debt('d6', 'carlos', 2750, 'Cumpleaños de Ana', 8),
  debt('d7', 'lucia', 1500, 'Entradas del concierto', 5),
  debt('d8', 'javi', 1250, 'Taxi al aeropuerto', 3),
];

function settings(patch: Partial<Settings> = {}): Settings {
  return { ...defaultSettings, ...patch };
}

function plan(patch: Partial<Settings> = {}, data = debts) {
  return planNotifications({ people, debts: data, settings: settings(patch), now: NOW });
}

describe('sin nada que recordar', () => {
  it('sin deudas no programa nada', () => {
    expect(planNotifications({ people, debts: [], settings: settings(), now: NOW })).toEqual([]);
  });

  it('con todas las deudas pagadas cancela todo', () => {
    const paid = debts.map((item) => ({ ...item, paidAt: NOW - DAY }));
    expect(plan({}, paid)).toEqual([]);
  });

  it('con el resumen en "nunca" y los avisos apagados no programa nada', () => {
    expect(plan({ summaryFrequency: 'never', ageAlerts: false })).toEqual([]);
  });
});

describe('resumen periódico', () => {
  it('el semanal llega el domingo a las 19:00 con el total y tres nombres', () => {
    const [first] = plan({ ageAlerts: false });
    expect(first).toMatchObject({
      fireAt: at(2026, 11, 15),
      kind: 'summary',
      title: 'Te deben 147,50 €',
      body: 'Marta 60 €, Pedro 32,50 €, Carlos 27,50 € y 2 personas más.',
      personId: null,
      actionName: null,
      debtIds: [],
    });
  });

  it('el semanal se repite cada 7 días', () => {
    const result = plan({ ageAlerts: false });
    expect(result[1]?.fireAt).toBe(at(2026, 11, 22));
    expect(result[2]?.fireAt).toBe(at(2026, 11, 29));
  });

  it('respeta el día y la hora elegidos', () => {
    const [first] = plan({
      ageAlerts: false,
      summaryWeekday: 5,
      summaryHour: 9,
      summaryMinute: 30,
    });
    expect(first?.fireAt).toBe(at(2026, 11, 13, 9, 30));
  });

  it('si la hora de hoy ya pasó, empieza en la siguiente ocasión', () => {
    // Hoy es jueves a las 10:00; un resumen de jueves a las 9:00 ya no cabe hoy.
    const [first] = plan({ ageAlerts: false, summaryWeekday: 4, summaryHour: 9 });
    expect(first?.fireAt).toBe(at(2026, 11, 19, 9));
  });

  it('el quincenal deja 14 días entre avisos', () => {
    const result = plan({ ageAlerts: false, summaryFrequency: 'biweekly' });
    expect(result.length).toBeGreaterThan(2);
    for (let index = 1; index < result.length; index++) {
      const gap = Math.round(
        ((result[index]?.fireAt ?? 0) - (result[index - 1]?.fireAt ?? 0)) / DAY,
      );
      expect(gap).toBe(14);
    }
  });

  it('el de cada 3 días deja 3 días entre avisos', () => {
    const result = plan({ ageAlerts: false, summaryFrequency: 'every3days' });
    const gap = Math.round(((result[1]?.fireAt ?? 0) - (result[0]?.fireAt ?? 0)) / DAY);
    expect(gap).toBe(3);
  });

  it('la cadencia no depende de cuándo se abra la app', () => {
    const base = settings({ summaryFrequency: 'biweekly' });
    const today = isSummaryDay(at(2026, 11, 15), base);
    const nextWeek = isSummaryDay(at(2026, 11, 22), base);
    expect(today).not.toBe(nextWeek);
  });

  it('con una sola persona el resumen habla de ella y lleva botones', () => {
    const [first] = plan({ ageAlerts: false }, [debt('d7', 'lucia', 1500, 'Entradas', 1)]);
    expect(first).toMatchObject({
      title: 'Lucía te debe 15 €',
      body: 'Entradas',
      personId: 'lucia',
      actionName: 'Lucía',
      debtIds: ['d7'],
    });
  });
});

describe('avisos por antigüedad', () => {
  const only = [debt('d7', 'lucia', 1500, 'Entradas del concierto', 5)];

  it('avisa a los 7 días con el concepto y los botones', () => {
    const [first] = plan({ summaryFrequency: 'never' }, only);
    expect(first).toMatchObject({
      fireAt: at(2026, 11, 14),
      kind: 'age',
      title: 'Lucía te debe 15 € desde hace una semana',
      body: 'Entradas del concierto',
      personId: 'lucia',
      actionName: 'Lucía',
      debtIds: ['d7'],
    });
  });

  it('vuelve a avisar a los 30 días', () => {
    const result = plan({ summaryFrequency: 'never' }, only);
    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({
      fireAt: at(2026, 12, 7),
      title: 'Lucía te debe 15 € desde hace un mes',
    });
  });

  it('no avisa de aniversarios que ya pasaron', () => {
    const old = [debt('d1', 'marta', 2500, 'Cena', 34)];
    expect(plan({ summaryFrequency: 'never' }, old)).toEqual([]);
  });

  it('con los avisos apagados solo quedan los resúmenes', () => {
    const result = plan({ ageAlerts: false }, only);
    expect(result.every((item) => item.kind === 'summary')).toBe(true);
  });

  it('agrupa en un aviso las deudas de una persona que coinciden el mismo día', () => {
    const same = [debt('a', 'pedro', 2000, 'Cena', 5), debt('b', 'pedro', 1250, 'Cine', 5)];
    const [first] = plan({ summaryFrequency: 'never' }, same);
    expect(first).toMatchObject({
      title: 'Pedro te debe 32,50 € desde hace una semana',
      body: 'Cena, Cine',
      personId: 'pedro',
      debtIds: ['a', 'b'],
    });
  });

  it('agrupa en un aviso sin botones a varias personas el mismo día', () => {
    const same = [debt('a', 'pedro', 2000, 'Cena', 5), debt('b', 'lucia', 1500, 'Entradas', 5)];
    const [first] = plan({ summaryFrequency: 'never' }, same);
    expect(first).toMatchObject({
      title: '2 deudas siguen pendientes desde hace una semana',
      body: 'Pedro 20 € y Lucía 15 €.',
      personId: null,
      actionName: null,
      debtIds: [],
    });
  });
});

describe('como máximo una notificación al día', () => {
  it('nunca hay dos avisos el mismo día', () => {
    const result = plan({ summaryFrequency: 'every3days' });
    const days = result.map((item) => new Date(item.fireAt).toDateString());
    expect(new Set(days).size).toBe(days.length);
  });

  it('si un aviso por antigüedad coincide con el resumen, queda solo el resumen', () => {
    // Deuda de hace 4 días: cumple 7 el domingo 15, día del resumen semanal.
    const result = plan({}, [
      debt('x', 'lucia', 1500, 'Entradas', 4),
      debt('y', 'pedro', 2000, null, 1),
    ]);
    const sunday = result.filter((item) => item.fireAt === at(2026, 11, 15));
    expect(sunday).toHaveLength(1);
    expect(sunday[0]?.kind).toBe('summary');
  });

  it('todos los identificadores son únicos', () => {
    const result = plan({ summaryFrequency: 'every3days' });
    expect(new Set(result.map((item) => item.id)).size).toBe(result.length);
  });
});

describe('límites del sistema', () => {
  it('nunca programa más de 60 (iOS admite 64)', () => {
    const many: Debt[] = Array.from({ length: 80 }, (_, index) =>
      debt(`m${index}`, people[index % people.length]?.id ?? 'marta', 1000 + index, null, -index),
    );
    const result = plan({ summaryFrequency: 'every3days' }, many);
    expect(result.length).toBeLessThanOrEqual(MAX_SCHEDULED);
    expect(result.length).toBe(MAX_SCHEDULED);
  });

  it('se queda con los avisos más próximos, en orden', () => {
    const result = plan({ summaryFrequency: 'every3days' });
    const times = result.map((item) => item.fireAt);
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  it('todo lo programado es futuro', () => {
    expect(plan().every((item) => item.fireAt > NOW)).toBe(true);
  });
});

describe('ocultar cantidades', () => {
  it('no muestra nombres ni importes, ni botones', () => {
    const result = plan({ hideAmounts: true });
    expect(result.length).toBeGreaterThan(0);
    for (const item of result) {
      expect(item.title).toBe('Tienes 5 cobros pendientes');
      expect(item.body).toBe('Abre Mober para verlos.');
      expect(item.actionName).toBeNull();
      expect(item.debtIds).toEqual([]);
      expect(`${item.title} ${item.body}`).not.toMatch(/€|Marta|Pedro|Lucía/);
    }
  });

  it('usa el singular con una sola persona', () => {
    const [first] = plan({ hideAmounts: true }, [debt('d7', 'lucia', 1500, 'Entradas', 1)]);
    expect(first?.title).toBe('Tienes 1 cobro pendiente');
  });
});

describe('lista de nombres del resumen', () => {
  const summary = (name: string, totalCents: number) => ({
    person: person(name, name),
    pending: [],
    totalCents,
    oldestAt: NOW,
  });

  it('une dos o tres nombres con "y"', () => {
    expect(describePeople([summary('Marta', 6000), summary('Pedro', 3250)])).toBe(
      'Marta 60 € y Pedro 32,50 €.',
    );
    expect(
      describePeople([summary('Marta', 6000), summary('Pedro', 3250), summary('Carlos', 2750)]),
    ).toBe('Marta 60 €, Pedro 32,50 € y Carlos 27,50 €.');
  });

  it('con cuatro personas nombra tres y cuenta la que falta', () => {
    expect(
      describePeople([
        summary('Marta', 6000),
        summary('Pedro', 3250),
        summary('Carlos', 2750),
        summary('Lucía', 1500),
      ]),
    ).toBe('Marta 60 €, Pedro 32,50 €, Carlos 27,50 € y 1 persona más.');
  });

  it('ordena por cantidad, de mayor a menor', () => {
    expect(describePeople([summary('Javi', 1250), summary('Marta', 6000)])).toBe(
      'Marta 60 € y Javi 12,50 €.',
    );
  });
});
