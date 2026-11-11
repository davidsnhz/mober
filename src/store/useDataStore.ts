import { create } from 'zustand';

import { getRepository } from '@/db';
import type { Debt, DebtPatch, Person, PersonPatch, Snapshot } from '@/db/types';
import { newId } from '@/lib/id';
import { cleanText } from '@/lib/text';

import { findPersonByName } from './selectors';
import { useSettingsStore } from './useSettingsStore';

export interface NewDebtInput {
  /** Persona existente elegida de las sugerencias, si la hay. */
  personId?: string;
  /** Nombre escrito; si coincide con alguien ya guardado se reutiliza esa persona. */
  personName: string;
  amountCents: number;
  concept: string | null;
}

export interface NewDebtResult {
  person: Person;
  debt: Debt;
  /** Es la primera deuda que se guarda en la app: momento de pedir permiso de avisos. */
  isFirstDebt: boolean;
}

type Status = 'loading' | 'ready' | 'error';

interface DataState {
  status: Status;
  people: Person[];
  debts: Debt[];

  bootstrap: () => Promise<void>;
  /** Vuelve a leer los datos guardados (por ejemplo, tras una acción en segundo plano). */
  reload: () => Promise<void>;

  addDebt: (input: NewDebtInput) => Promise<NewDebtResult>;
  updateDebt: (id: string, patch: DebtPatch) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  /** Marca deudas como pagadas ahora; devuelve los ids para poder deshacer. */
  markPaid: (ids: readonly string[]) => Promise<void>;
  markPending: (ids: readonly string[]) => Promise<void>;

  updatePerson: (id: string, patch: PersonPatch) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;

  /** Copia completa de los datos, para "Exportar copia". */
  snapshot: () => Snapshot;
}

function logWriteError(error: unknown): void {
  console.error('No se pudo guardar el cambio', error);
}

export const useDataStore = create<DataState>((set, get) => ({
  status: 'loading',
  people: [],
  debts: [],

  bootstrap: async () => {
    try {
      const repository = await getRepository();
      const snapshot = await repository.load();
      useSettingsStore.getState().hydrate(snapshot.settings);
      set({ status: 'ready', people: snapshot.people, debts: snapshot.debts });
    } catch (error) {
      console.error('No se pudo abrir la base de datos', error);
      set({ status: 'error' });
    }
  },

  reload: async () => {
    try {
      const repository = await getRepository();
      const snapshot = await repository.load();
      set({ status: 'ready', people: snapshot.people, debts: snapshot.debts });
    } catch (error) {
      logWriteError(error);
    }
  },

  addDebt: async ({ personId, personName, amountCents, concept }) => {
    const repository = await getRepository();
    const { people, debts } = get();
    const now = Date.now();

    let person =
      (personId ? people.find((candidate) => candidate.id === personId) : undefined) ??
      findPersonByName(people, personName);
    let nextPeople = people;

    if (!person) {
      person = {
        id: newId(),
        name: cleanText(personName),
        phone: null,
        contactId: null,
        createdAt: now,
      };
      await repository.insertPerson(person);
      nextPeople = [...people, person];
    }

    const cleanedConcept = concept ? cleanText(concept) : '';
    const debt: Debt = {
      id: newId(),
      personId: person.id,
      amountCents,
      concept: cleanedConcept === '' ? null : cleanedConcept,
      createdAt: now,
      paidAt: null,
    };
    await repository.insertDebt(debt);

    set({ people: nextPeople, debts: [...debts, debt] });
    return { person, debt, isFirstDebt: debts.length === 0 };
  },

  updateDebt: async (id, patch) => {
    set({ debts: get().debts.map((debt) => (debt.id === id ? { ...debt, ...patch } : debt)) });
    try {
      await (await getRepository()).updateDebt(id, patch);
    } catch (error) {
      logWriteError(error);
      await get().reload();
    }
  },

  deleteDebt: async (id) => {
    set({ debts: get().debts.filter((debt) => debt.id !== id) });
    try {
      await (await getRepository()).deleteDebt(id);
    } catch (error) {
      logWriteError(error);
      await get().reload();
    }
  },

  markPaid: async (ids) => {
    const targets = new Set(ids);
    const paidAt = Date.now();
    set({ debts: get().debts.map((debt) => (targets.has(debt.id) ? { ...debt, paidAt } : debt)) });
    try {
      await (await getRepository()).setDebtsPaid(ids, paidAt);
    } catch (error) {
      logWriteError(error);
      await get().reload();
    }
  },

  markPending: async (ids) => {
    const targets = new Set(ids);
    set({
      debts: get().debts.map((debt) => (targets.has(debt.id) ? { ...debt, paidAt: null } : debt)),
    });
    try {
      await (await getRepository()).setDebtsPaid(ids, null);
    } catch (error) {
      logWriteError(error);
      await get().reload();
    }
  },

  updatePerson: async (id, patch) => {
    set({
      people: get().people.map((person) => (person.id === id ? { ...person, ...patch } : person)),
    });
    try {
      await (await getRepository()).updatePerson(id, patch);
    } catch (error) {
      logWriteError(error);
      await get().reload();
    }
  },

  deletePerson: async (id) => {
    set({
      people: get().people.filter((person) => person.id !== id),
      debts: get().debts.filter((debt) => debt.personId !== id),
    });
    try {
      await (await getRepository()).deletePerson(id);
    } catch (error) {
      logWriteError(error);
      await get().reload();
    }
  },

  snapshot: () => {
    const { people, debts } = get();
    const settings = useSettingsStore.getState().settings;
    return {
      people,
      debts,
      settings: Object.fromEntries(
        Object.entries(settings).map(([key, value]) => [key, String(value)]),
      ),
    };
  },
}));
