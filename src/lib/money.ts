/**
 * Dinero. Las cantidades se guardan y se suman siempre en céntimos enteros;
 * solo se convierten a texto al mostrarlas.
 */

const LOCALE = 'es-ES';

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const wholeCurrencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Intl separa el símbolo con un espacio duro; lo normalizamos a un espacio corriente. */
function tidy(text: string): string {
  return text.replace(/[\u00A0\u202F]/g, ' ');
}

/** "147,50 €". Siempre con dos decimales. */
export function formatMoney(cents: number): string {
  return tidy(currencyFormatter.format(cents / 100));
}

/** "60 €" o "32,50 €". Sin decimales cuando la cantidad es redonda; para mensajes y avisos. */
export function formatMoneyCompact(cents: number): string {
  const formatter = cents % 100 === 0 ? wholeCurrencyFormatter : currencyFormatter;
  return tidy(formatter.format(cents / 100));
}

/** "147,50", sin símbolo: para las cantidades grandes donde el € va aparte y en verde. */
export function formatAmount(cents: number): string {
  return tidy(numberFormatter.format(cents / 100));
}

/** Suma de cantidades en céntimos. */
export function sumCents(amounts: readonly number[]): number {
  let total = 0;
  for (const amount of amounts) total += amount;
  return total;
}

// ── Teclado numérico ────────────────────────────────────────────────────────

export type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ',' | 'del';

const MAX_INTEGER_DIGITS = 6;
const MAX_DECIMALS = 2;

/**
 * Aplica una tecla al texto de la cantidad ("", "20", "20,", "20,5").
 * Devuelve el mismo texto si la tecla no es válida en ese punto.
 */
export function applyKeypadKey(current: string, key: KeypadKey): string {
  if (key === 'del') return current.slice(0, -1);

  const [integer = '', decimals] = current.split(',');
  const hasComma = decimals !== undefined;

  if (key === ',') {
    if (hasComma) return current;
    return integer === '' ? '0,' : `${current},`;
  }

  if (hasComma) {
    return decimals.length >= MAX_DECIMALS ? current : current + key;
  }
  if (integer === '0') return key === '0' ? current : key;
  if (integer.length >= MAX_INTEGER_DIGITS) return current;
  return current + key;
}

/** Convierte el texto del teclado a céntimos enteros, sin pasar por decimales. */
export function inputToCents(input: string): number {
  const [integer = '', decimals = ''] = input.split(',');
  const euros = integer === '' ? 0 : Number.parseInt(integer, 10);
  const cents = Number.parseInt(decimals.padEnd(MAX_DECIMALS, '0').slice(0, MAX_DECIMALS), 10);
  if (Number.isNaN(euros) || Number.isNaN(cents)) return 0;
  return euros * 100 + cents;
}

/** Texto inicial del teclado para editar una cantidad existente. */
export function centsToInput(cents: number): string {
  const euros = Math.trunc(cents / 100);
  const rest = cents % 100;
  if (rest === 0) return String(euros);
  return `${euros},${String(rest).padStart(2, '0')}`;
}

/** Lo que se pinta mientras se teclea: "0,00", "20", "20,", "20,5", "20,50". */
export function formatInput(input: string): string {
  if (input === '') return '0,00';
  const [integer = '0', decimals] = input.split(',');
  const grouped = tidy(new Intl.NumberFormat(LOCALE).format(Number.parseInt(integer, 10)));
  return decimals === undefined ? grouped : `${grouped},${decimals}`;
}
