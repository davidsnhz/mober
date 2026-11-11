import type { Debt, DebtPatch, Person, PersonPatch, Snapshot } from './types';

/**
 * Único punto de acceso a los datos. La app solo conoce esta interfaz; debajo puede haber
 * SQLite (iOS, Android y web cuando el navegador lo permite) o localStorage (web de reserva).
 */
export interface Repository {
  /** Nombre de la implementación, útil para diagnósticos. */
  readonly kind: 'sqlite' | 'local';

  /** Abre el almacenamiento y aplica las migraciones pendientes. */
  init(): Promise<void>;

  /** Lee todo el contenido: la app trabaja con los datos en memoria. */
  load(): Promise<Snapshot>;

  insertPerson(person: Person): Promise<void>;
  updatePerson(id: string, patch: PersonPatch): Promise<void>;
  /** Borra la persona y todas sus deudas. */
  deletePerson(id: string): Promise<void>;

  insertDebt(debt: Debt): Promise<void>;
  updateDebt(id: string, patch: DebtPatch): Promise<void>;
  /** Marca varias deudas como pagadas (o pendientes, con null) en una sola operación. */
  setDebtsPaid(ids: readonly string[], paidAt: number | null): Promise<void>;
  deleteDebt(id: string): Promise<void>;

  setSetting(key: string, value: string): Promise<void>;
}
