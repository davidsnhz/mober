import type { Repository } from './repository';
import type { Debt, DebtPatch, Person, PersonPatch, Snapshot } from './types';

/** Lo mínimo que necesitamos de `localStorage`; permite inyectar otro almacén en los tests. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_KEY = 'mober.data';
const LOCAL_SCHEMA_VERSION = 1;

interface StoredData extends Snapshot {
  schemaVersion: number;
}

function emptyData(): StoredData {
  return { schemaVersion: LOCAL_SCHEMA_VERSION, people: [], debts: [], settings: {} };
}

/** Migraciones del almacén JSON, equivalentes a las de SQLite. */
function migrate(data: StoredData): StoredData {
  // Versión 1: esquema inicial. Las versiones futuras transforman `data` aquí, paso a paso.
  return { ...data, schemaVersion: LOCAL_SCHEMA_VERSION };
}

/**
 * Implementación de reserva para web: mismo contrato que SQLite, guardado como un único
 * documento JSON. Los datos de Mober son pequeños, así que reescribirlo entero es barato.
 */
export class LocalRepository implements Repository {
  readonly kind = 'local' as const;
  private data: StoredData = emptyData();

  constructor(private readonly storage: KeyValueStorage) {}

  async init(): Promise<void> {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (!raw) {
      this.data = emptyData();
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<StoredData>;
      this.data = migrate({
        schemaVersion: parsed.schemaVersion ?? 0,
        people: parsed.people ?? [],
        debts: parsed.debts ?? [],
        settings: parsed.settings ?? {},
      });
    } catch {
      this.data = emptyData();
    }
  }

  private persist(): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  async load(): Promise<Snapshot> {
    return {
      people: this.data.people.map((person) => ({ ...person })),
      debts: this.data.debts.map((debt) => ({ ...debt })),
      settings: { ...this.data.settings },
    };
  }

  async insertPerson(person: Person): Promise<void> {
    this.data.people.push({ ...person });
    this.persist();
  }

  async updatePerson(id: string, patch: PersonPatch): Promise<void> {
    this.data.people = this.data.people.map((person) =>
      person.id === id ? { ...person, ...patch } : person,
    );
    this.persist();
  }

  async deletePerson(id: string): Promise<void> {
    this.data.people = this.data.people.filter((person) => person.id !== id);
    this.data.debts = this.data.debts.filter((debt) => debt.personId !== id);
    this.persist();
  }

  async insertDebt(debt: Debt): Promise<void> {
    this.data.debts.push({ ...debt });
    this.persist();
  }

  async updateDebt(id: string, patch: DebtPatch): Promise<void> {
    this.data.debts = this.data.debts.map((debt) =>
      debt.id === id ? { ...debt, ...patch } : debt,
    );
    this.persist();
  }

  async setDebtsPaid(ids: readonly string[], paidAt: number | null): Promise<void> {
    const targets = new Set(ids);
    this.data.debts = this.data.debts.map((debt) =>
      targets.has(debt.id) ? { ...debt, paidAt } : debt,
    );
    this.persist();
  }

  async deleteDebt(id: string): Promise<void> {
    this.data.debts = this.data.debts.filter((debt) => debt.id !== id);
    this.persist();
  }

  async setSetting(key: string, value: string): Promise<void> {
    this.data.settings[key] = value;
    this.persist();
  }
}
