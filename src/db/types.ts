export interface Person {
  id: string;
  name: string;
  /** Teléfono en formato E.164 ("+34612345678") o null si no hay contacto vinculado. */
  phone: string | null;
  /** Identificador del contacto del sistema, si se vinculó desde la agenda. */
  contactId: string | null;
  createdAt: number;
}

export interface Debt {
  id: string;
  personId: string;
  /** Cantidad en céntimos enteros. Nunca decimales. */
  amountCents: number;
  concept: string | null;
  createdAt: number;
  /** Marca de tiempo del pago, o null si sigue pendiente. */
  paidAt: number | null;
}

export type PersonPatch = Partial<Pick<Person, 'name' | 'phone' | 'contactId'>>;
export type DebtPatch = Partial<Pick<Debt, 'amountCents' | 'concept' | 'paidAt'>>;

export interface Snapshot {
  people: Person[];
  debts: Debt[];
  settings: Record<string, string>;
}
