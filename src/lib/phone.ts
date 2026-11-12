import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/min';

/** País con el que se interpretan los números guardados sin prefijo internacional. */
const DEFAULT_COUNTRY: CountryCode = 'ES';

/**
 * Normaliza un teléfono tal y como viene de la agenda ("612 34 56 78", "0034 612…") a E.164
 * ("+34612345678"). Devuelve null si no parece un número válido.
 */
export function toE164(raw: string, country: CountryCode = DEFAULT_COUNTRY): string | null {
  const parsed = parsePhoneNumberFromString(raw, country);
  return parsed?.isPossible() ? parsed.number : null;
}

/** "+34 612 34 56 78", para mostrarlo. */
export function formatPhone(e164: string): string {
  return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164;
}
