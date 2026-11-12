import { LocalRepository, type KeyValueStorage } from '../localRepository';
import { LATEST_SCHEMA_VERSION, migrations, pendingMigrations } from '../migrations';
import type { Debt, Person } from '../types';

function memoryStorage(): KeyValueStorage & { dump: () => Record<string, string> } {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    dump: () => Object.fromEntries(values),
  };
}

const pedro: Person = { id: 'p', name: 'Pedro', phone: null, contactId: null, createdAt: 1 };
const cena: Debt = {
  id: 'd',
  personId: 'p',
  amountCents: 2050,
  concept: 'Cena',
  createdAt: 2,
  paidAt: null,
};

describe('repositorio de reserva (web)', () => {
  it('guarda y recupera los datos tras volver a abrir', async () => {
    const storage = memoryStorage();
    const first = new LocalRepository(storage);
    await first.init();
    await first.insertPerson(pedro);
    await first.insertDebt(cena);
    await first.setSetting('theme', 'dark');

    const second = new LocalRepository(storage);
    await second.init();
    expect(await second.load()).toEqual({
      people: [pedro],
      debts: [cena],
      settings: { theme: 'dark' },
    });
  });

  it('las cantidades se guardan como céntimos enteros', async () => {
    const storage = memoryStorage();
    const repository = new LocalRepository(storage);
    await repository.init();
    await repository.insertPerson(pedro);
    await repository.insertDebt(cena);
    const stored = JSON.parse(storage.dump()['mober.data'] ?? '{}') as { debts: Debt[] };
    expect(stored.debts[0]?.amountCents).toBe(2050);
    expect(Number.isInteger(stored.debts[0]?.amountCents)).toBe(true);
  });

  it('marca varias deudas como pagadas y permite deshacerlo', async () => {
    const repository = new LocalRepository(memoryStorage());
    await repository.init();
    await repository.insertPerson(pedro);
    await repository.insertDebt(cena);
    await repository.insertDebt({ ...cena, id: 'e' });

    await repository.setDebtsPaid(['d', 'e'], 99);
    expect((await repository.load()).debts.map((debt) => debt.paidAt)).toEqual([99, 99]);

    await repository.setDebtsPaid(['d'], null);
    expect((await repository.load()).debts.map((debt) => debt.paidAt)).toEqual([null, 99]);
  });

  it('borrar una persona borra también sus deudas', async () => {
    const repository = new LocalRepository(memoryStorage());
    await repository.init();
    await repository.insertPerson(pedro);
    await repository.insertDebt(cena);
    await repository.deletePerson('p');
    expect(await repository.load()).toEqual({ people: [], debts: [], settings: {} });
  });

  it('edita personas y deudas', async () => {
    const repository = new LocalRepository(memoryStorage());
    await repository.init();
    await repository.insertPerson(pedro);
    await repository.insertDebt(cena);
    await repository.updatePerson('p', { phone: '+34612345678', contactId: 'c1' });
    await repository.updateDebt('d', { amountCents: 1000, concept: null });
    const { people, debts } = await repository.load();
    expect(people[0]).toMatchObject({ phone: '+34612345678', contactId: 'c1', name: 'Pedro' });
    expect(debts[0]).toMatchObject({ amountCents: 1000, concept: null });
  });

  it('empieza vacío si lo guardado está corrupto', async () => {
    const storage = memoryStorage();
    storage.setItem('mober.data', '{no es json');
    const repository = new LocalRepository(storage);
    await repository.init();
    expect(await repository.load()).toEqual({ people: [], debts: [], settings: {} });
  });
});

describe('migraciones', () => {
  it('están numeradas de forma consecutiva desde 1', () => {
    expect(migrations.map((migration) => migration.version)).toEqual(
      migrations.map((_, index) => index + 1),
    );
    expect(LATEST_SCHEMA_VERSION).toBe(migrations.length);
  });

  it('solo se aplican las que faltan', () => {
    expect(pendingMigrations(0)).toHaveLength(migrations.length);
    expect(pendingMigrations(LATEST_SCHEMA_VERSION)).toEqual([]);
  });

  it('el importe se define como entero', () => {
    const schema = migrations.flatMap((migration) => migration.statements).join('\n');
    expect(schema).toMatch(/amount_cents INTEGER NOT NULL/);
  });
});
