import * as SQLite from 'expo-sqlite';

import { pendingMigrations } from './migrations';
import type { Repository } from './repository';
import type { Debt, DebtPatch, Person, PersonPatch, Snapshot } from './types';

const DATABASE_NAME = 'mober.db';

interface PersonRow {
  id: string;
  name: string;
  phone: string | null;
  contact_id: string | null;
  created_at: number;
}

interface DebtRow {
  id: string;
  person_id: string;
  amount_cents: number;
  concept: string | null;
  created_at: number;
  paid_at: number | null;
}

interface SettingRow {
  key: string;
  value: string;
}

function toPerson(row: PersonRow): Person {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    contactId: row.contact_id,
    createdAt: row.created_at,
  };
}

function toDebt(row: DebtRow): Debt {
  return {
    id: row.id,
    personId: row.person_id,
    amountCents: row.amount_cents,
    concept: row.concept,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  };
}

export class SqliteRepository implements Repository {
  readonly kind = 'sqlite' as const;
  private db: SQLite.SQLiteDatabase | null = null;

  private get database(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('La base de datos no está abierta');
    return this.db;
  }

  async init(): Promise<void> {
    const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
    await db.execAsync('PRAGMA foreign_keys = ON;');
    if (process.env.EXPO_OS !== 'web') {
      await db.execAsync('PRAGMA journal_mode = WAL;');
    }
    await this.migrate(db);
    this.db = db;
  }

  private async migrate(db: SQLite.SQLiteDatabase): Promise<void> {
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const current = row?.user_version ?? 0;

    for (const migration of pendingMigrations(current)) {
      await db.execAsync('BEGIN');
      try {
        for (const statement of migration.statements) {
          await db.execAsync(statement);
        }
        // PRAGMA no admite parámetros; la versión es un entero definido en el código.
        await db.execAsync(`PRAGMA user_version = ${Math.trunc(migration.version)}`);
        await db.execAsync('COMMIT');
      } catch (error) {
        await db.execAsync('ROLLBACK');
        throw error;
      }
    }
  }

  async load(): Promise<Snapshot> {
    const db = this.database;
    const [people, debts, settings] = await Promise.all([
      db.getAllAsync<PersonRow>('SELECT * FROM people ORDER BY created_at ASC'),
      db.getAllAsync<DebtRow>('SELECT * FROM debts ORDER BY created_at ASC'),
      db.getAllAsync<SettingRow>('SELECT key, value FROM settings'),
    ]);
    return {
      people: people.map(toPerson),
      debts: debts.map(toDebt),
      settings: Object.fromEntries(settings.map((row) => [row.key, row.value])),
    };
  }

  async insertPerson(person: Person): Promise<void> {
    await this.database.runAsync(
      'INSERT INTO people (id, name, phone, contact_id, created_at) VALUES (?, ?, ?, ?, ?)',
      [person.id, person.name, person.phone, person.contactId, person.createdAt],
    );
  }

  async updatePerson(id: string, patch: PersonPatch): Promise<void> {
    const sets: string[] = [];
    const values: (string | null)[] = [];
    if (patch.name !== undefined) {
      sets.push('name = ?');
      values.push(patch.name);
    }
    if (patch.phone !== undefined) {
      sets.push('phone = ?');
      values.push(patch.phone);
    }
    if (patch.contactId !== undefined) {
      sets.push('contact_id = ?');
      values.push(patch.contactId);
    }
    if (sets.length === 0) return;
    await this.database.runAsync(`UPDATE people SET ${sets.join(', ')} WHERE id = ?`, [
      ...values,
      id,
    ]);
  }

  async deletePerson(id: string): Promise<void> {
    const db = this.database;
    // Borrado explícito de las deudas además del ON DELETE CASCADE, por si las claves
    // foráneas estuvieran desactivadas en la conexión.
    await db.runAsync('DELETE FROM debts WHERE person_id = ?', [id]);
    await db.runAsync('DELETE FROM people WHERE id = ?', [id]);
  }

  async insertDebt(debt: Debt): Promise<void> {
    await this.database.runAsync(
      'INSERT INTO debts (id, person_id, amount_cents, concept, created_at, paid_at) VALUES (?, ?, ?, ?, ?, ?)',
      [debt.id, debt.personId, debt.amountCents, debt.concept, debt.createdAt, debt.paidAt],
    );
  }

  async updateDebt(id: string, patch: DebtPatch): Promise<void> {
    const sets: string[] = [];
    const values: (string | number | null)[] = [];
    if (patch.amountCents !== undefined) {
      sets.push('amount_cents = ?');
      values.push(patch.amountCents);
    }
    if (patch.concept !== undefined) {
      sets.push('concept = ?');
      values.push(patch.concept);
    }
    if (patch.paidAt !== undefined) {
      sets.push('paid_at = ?');
      values.push(patch.paidAt);
    }
    if (sets.length === 0) return;
    await this.database.runAsync(`UPDATE debts SET ${sets.join(', ')} WHERE id = ?`, [
      ...values,
      id,
    ]);
  }

  async setDebtsPaid(ids: readonly string[], paidAt: number | null): Promise<void> {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(', ');
    await this.database.runAsync(`UPDATE debts SET paid_at = ? WHERE id IN (${placeholders})`, [
      paidAt,
      ...ids,
    ]);
  }

  async deleteDebt(id: string): Promise<void> {
    await this.database.runAsync('DELETE FROM debts WHERE id = ?', [id]);
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.database.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value],
    );
  }
}
