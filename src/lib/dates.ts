const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const WEEKDAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Medianoche local del día al que pertenece la marca de tiempo. */
export function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** Días naturales transcurridos entre dos marcas de tiempo (0 = el mismo día). */
export function daysBetween(from: number, to: number): number {
  return Math.max(0, Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS));
}

/** "hoy", "ayer", "hace 12 días". */
export function formatAgo(timestamp: number, now: number): string {
  const days = daysBetween(timestamp, now);
  if (days === 0) return 'hoy';
  if (days === 1) return 'ayer';
  return `hace ${days} días`;
}

/** "30 oct"; añade el año si no es el actual: "30 oct 2025". */
export function formatShortDate(timestamp: number, now: number): string {
  const date = new Date(timestamp);
  const base = `${date.getDate()} ${MONTHS[date.getMonth()] ?? ''}`;
  return date.getFullYear() === new Date(now).getFullYear()
    ? base
    : `${base} ${date.getFullYear()}`;
}

/** "19:00". */
export function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Mismo día a la hora indicada, en hora local. */
export function atTime(timestamp: number, hour: number, minute: number): number {
  const date = new Date(timestamp);
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}

/** Suma días naturales conservando la hora local (resistente a los cambios de hora). */
export function addDays(timestamp: number, days: number): number {
  const date = new Date(timestamp);
  date.setDate(date.getDate() + days);
  return date.getTime();
}
