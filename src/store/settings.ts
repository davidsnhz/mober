export type SummaryFrequency = 'every3days' | 'weekly' | 'biweekly' | 'never';
export type MessageTone = 'amable' | 'directo' | 'humor' | 'personalizada';
export type ThemePreference = 'auto' | 'light' | 'dark';

export interface Settings {
  /** Cada cuánto llega el resumen de lo que te deben. */
  summaryFrequency: SummaryFrequency;
  /** Día del resumen semanal o quincenal: 0 = domingo … 6 = sábado. */
  summaryWeekday: number;
  /** Hora de todos los avisos. */
  summaryHour: number;
  summaryMinute: number;
  /** Avisos cuando una deuda cumple 7 y 30 días. */
  ageAlerts: boolean;
  /** Notificaciones sin nombres ni importes. */
  hideAmounts: boolean;
  messageTone: MessageTone;
  /** Plantilla propia, usada cuando el tono es "personalizada". */
  customTemplate: string;
  theme: ThemePreference;
  /** Ya se pidió el permiso de notificaciones (al guardar la primera deuda). */
  notificationsPrompted: boolean;
}

export const defaultSettings: Settings = {
  summaryFrequency: 'weekly',
  summaryWeekday: 0,
  summaryHour: 19,
  summaryMinute: 0,
  ageAlerts: true,
  hideAmounts: false,
  messageTone: 'amable',
  customTemplate: '',
  theme: 'auto',
  notificationsPrompted: false,
};

export const FREQUENCY_LABELS: Record<SummaryFrequency, string> = {
  every3days: 'Cada 3 días',
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  never: 'Nunca',
};

export const THEME_LABELS: Record<ThemePreference, string> = {
  auto: 'Automático',
  light: 'Claro',
  dark: 'Oscuro',
};

function oneOf<T extends string>(value: string | undefined, options: readonly T[], fallback: T): T {
  return options.includes(value as T) ? (value as T) : fallback;
}

function integer(value: string | undefined, min: number, max: number, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function bool(value: string | undefined, fallback: boolean): boolean {
  if (value === '1') return true;
  if (value === '0') return false;
  return fallback;
}

/** Convierte las filas clave/valor de la tabla `settings` en ajustes con tipo. */
export function parseSettings(raw: Record<string, string>): Settings {
  const d = defaultSettings;
  return {
    summaryFrequency: oneOf(
      raw.summaryFrequency,
      ['every3days', 'weekly', 'biweekly', 'never'],
      d.summaryFrequency,
    ),
    summaryWeekday: integer(raw.summaryWeekday, 0, 6, d.summaryWeekday),
    summaryHour: integer(raw.summaryHour, 0, 23, d.summaryHour),
    summaryMinute: integer(raw.summaryMinute, 0, 59, d.summaryMinute),
    ageAlerts: bool(raw.ageAlerts, d.ageAlerts),
    hideAmounts: bool(raw.hideAmounts, d.hideAmounts),
    messageTone: oneOf(
      raw.messageTone,
      ['amable', 'directo', 'humor', 'personalizada'],
      d.messageTone,
    ),
    customTemplate: raw.customTemplate ?? d.customTemplate,
    theme: oneOf(raw.theme, ['auto', 'light', 'dark'], d.theme),
    notificationsPrompted: bool(raw.notificationsPrompted, d.notificationsPrompted),
  };
}

/** Valor de un ajuste tal y como se guarda en la tabla `settings`. */
export function serializeSetting(value: Settings[keyof Settings]): string {
  if (typeof value === 'boolean') return value ? '1' : '0';
  return String(value);
}
