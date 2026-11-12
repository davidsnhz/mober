import { formatMoneyCompact, sumCents } from '@/lib/money';
import { firstName, lowerFirst } from '@/lib/text';
import type { MessageTone } from '@/store/settings';

export type PresetTone = Exclude<MessageTone, 'personalizada'>;

interface TonePreset {
  label: string;
  /** Mensaje cuando hay una sola deuda con concepto. */
  withConcept: string;
  /** Mensaje cuando hay varias deudas o la deuda no tiene concepto. */
  withoutConcept: string;
}

export const TONE_PRESETS: Record<PresetTone, TonePreset> = {
  amable: {
    label: 'Amable',
    withConcept:
      '¡Hola, {nombre}! Te recuerdo los {cantidad} de {concepto}. Cuando puedas, me haces un Bizum. ¡Gracias!',
    withoutConcept:
      '¡Hola, {nombre}! Te recuerdo los {cantidad} que tenemos pendientes. Cuando puedas, me haces un Bizum. ¡Gracias!',
  },
  directo: {
    label: 'Directo',
    withConcept: '{nombre}, me debes {cantidad} de {concepto}. ¿Me lo pasas cuando puedas?',
    withoutConcept: '{nombre}, me debes {cantidad}. ¿Me lo pasas cuando puedas?',
  },
  humor: {
    label: 'Con humor',
    withConcept: '{nombre}, tus {cantidad} de {concepto} me echan de menos. ¿Los mandas de vuelta?',
    withoutConcept: '{nombre}, tus {cantidad} me echan de menos. ¿Los mandas de vuelta?',
  },
};

export const PRESET_TONES: readonly PresetTone[] = ['amable', 'directo', 'humor'];

export const TEMPLATE_VARIABLES = ['{nombre}', '{cantidad}', '{concepto}'] as const;

export interface ReminderDebt {
  amountCents: number;
  concept: string | null;
}

export interface ReminderInput {
  personName: string;
  /** Deudas pendientes de la persona. */
  debts: readonly ReminderDebt[];
  tone: MessageTone;
  /** Plantilla propia; solo se usa con el tono "personalizada". */
  customTemplate: string;
}

/** Sustituye las variables de una plantilla. Las que no se conocen se dejan tal cual. */
export function fillTemplate(
  template: string,
  values: { nombre: string; cantidad: string; concepto?: string },
): string {
  return template
    .replace(/\{nombre\}/gi, values.nombre)
    .replace(/\{cantidad\}/gi, values.cantidad)
    .replace(/\{concepto\}/gi, values.concepto ?? '');
}

/**
 * Adapta una plantilla propia cuando no hay un concepto que decir: quita "de {concepto}",
 * "por la {concepto}" o "({concepto})"; si la variable queda suelta, la cambia por un texto neutro.
 */
export function withoutConceptVariant(template: string): string {
  return template
    .replace(/\s*\(\s*\{concepto\}\s*\)/gi, '')
    .replace(/\s+(?:de|del|por|para)\s+(?:(?:el|la|los|las|lo)\s+)?\{concepto\}/gi, '')
    .replace(/\{concepto\}/gi, 'lo que tenemos pendiente')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

function templatesFor(tone: MessageTone, customTemplate: string): Omit<TonePreset, 'label'> {
  if (tone === 'personalizada') {
    const custom = customTemplate.trim();
    if (custom !== '') {
      return { withConcept: custom, withoutConcept: withoutConceptVariant(custom) };
    }
    return TONE_PRESETS.amable;
  }
  return TONE_PRESETS[tone];
}

/** La plantilla que se muestra y se edita en Ajustes para un tono dado. */
export function editableTemplate(tone: MessageTone, customTemplate: string): string {
  return templatesFor(tone, customTemplate).withConcept;
}

/**
 * Mensaje de recordatorio para WhatsApp. Con una sola deuda con concepto usa la plantilla
 * completa; con varias deudas o sin concepto, la variante "que tenemos pendientes".
 */
export function buildReminderMessage({
  personName,
  debts,
  tone,
  customTemplate,
}: ReminderInput): string {
  const templates = templatesFor(tone, customTemplate);
  const nombre = firstName(personName);
  const cantidad = formatMoneyCompact(sumCents(debts.map((debt) => debt.amountCents)));

  const onlyDebt = debts.length === 1 ? debts[0] : undefined;
  const concept = onlyDebt?.concept?.trim();

  if (concept) {
    return fillTemplate(templates.withConcept, { nombre, cantidad, concepto: lowerFirst(concept) });
  }
  return fillTemplate(templates.withoutConcept, { nombre, cantidad });
}
