/** Minúsculas y sin acentos: "José" y "jose" comparan igual. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Limpia espacios sobrantes de un nombre o concepto. */
export function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/** Iniciales para el avatar: "Pedro Martín" → "PM", "Lucía" → "LU". */
export function initials(name: string): string {
  const words = cleanText(name).split(' ').filter(Boolean);
  const first = words[0];
  if (!first) return '?';
  const second = words[1];
  const letters = second
    ? `${Array.from(first)[0] ?? ''}${Array.from(second)[0] ?? ''}`
    : Array.from(first).slice(0, 2).join('');
  return letters.toUpperCase();
}

/** Nombre de pila: "Pedro Martín" → "Pedro". */
export function firstName(name: string): string {
  return cleanText(name).split(' ')[0] ?? name;
}

/** "1 deuda" / "3 deudas". */
export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** Primera letra en minúscula, salvo siglas: "Cena del sábado" → "cena del sábado". */
export function lowerFirst(text: string): string {
  const [first = '', second = ''] = Array.from(text);
  if (first === '' || (second !== '' && second === second.toUpperCase() && /\p{L}/u.test(second))) {
    return text;
  }
  return first.toLowerCase() + text.slice(first.length);
}
