import {
  buildReminderMessage,
  editableTemplate,
  fillTemplate,
  withoutConceptVariant,
} from '../templates';
import { whatsappUrl } from '../url';

const pedro = { personName: 'Pedro Martín', customTemplate: '' };
const cena = { amountCents: 2000, concept: 'Cena del sábado' };
const cine = { amountCents: 1250, concept: 'Cine' };

describe('plantillas por defecto', () => {
  it('tono amable con una deuda y concepto', () => {
    expect(buildReminderMessage({ ...pedro, debts: [cena], tone: 'amable' })).toBe(
      '¡Hola, Pedro! Te recuerdo los 20 € de cena del sábado. Cuando puedas, me haces un Bizum. ¡Gracias!',
    );
  });

  it('tono directo', () => {
    expect(buildReminderMessage({ ...pedro, debts: [cena], tone: 'directo' })).toBe(
      'Pedro, me debes 20 € de cena del sábado. ¿Me lo pasas cuando puedas?',
    );
  });

  it('tono con humor', () => {
    expect(buildReminderMessage({ ...pedro, debts: [cena], tone: 'humor' })).toBe(
      'Pedro, tus 20 € de cena del sábado me echan de menos. ¿Los mandas de vuelta?',
    );
  });

  it('usa solo el nombre de pila', () => {
    const message = buildReminderMessage({ ...pedro, debts: [cena], tone: 'directo' });
    expect(message).not.toContain('Martín');
  });
});

describe('adaptación del texto', () => {
  it('con varias deudas suma el total y no nombra un concepto', () => {
    expect(buildReminderMessage({ ...pedro, debts: [cena, cine], tone: 'amable' })).toBe(
      '¡Hola, Pedro! Te recuerdo los 32,50 € que tenemos pendientes. Cuando puedas, me haces un Bizum. ¡Gracias!',
    );
  });

  it('sin concepto no deja huecos en ningún tono', () => {
    const debts = [{ amountCents: 1500, concept: null }];
    expect(buildReminderMessage({ ...pedro, debts, tone: 'amable' })).toBe(
      '¡Hola, Pedro! Te recuerdo los 15 € que tenemos pendientes. Cuando puedas, me haces un Bizum. ¡Gracias!',
    );
    expect(buildReminderMessage({ ...pedro, debts, tone: 'directo' })).toBe(
      'Pedro, me debes 15 €. ¿Me lo pasas cuando puedas?',
    );
    expect(buildReminderMessage({ ...pedro, debts, tone: 'humor' })).toBe(
      'Pedro, tus 15 € me echan de menos. ¿Los mandas de vuelta?',
    );
  });

  it('un concepto en blanco cuenta como sin concepto', () => {
    const message = buildReminderMessage({
      ...pedro,
      debts: [{ amountCents: 1500, concept: '   ' }],
      tone: 'directo',
    });
    expect(message).toBe('Pedro, me debes 15 €. ¿Me lo pasas cuando puedas?');
  });

  it('respeta las siglas al pasar el concepto a minúscula', () => {
    const message = buildReminderMessage({
      ...pedro,
      debts: [{ amountCents: 4500, concept: 'ITV del coche' }],
      tone: 'directo',
    });
    expect(message).toContain('45 € de ITV del coche');
  });
});

describe('plantilla personalizada', () => {
  const custom = 'Oye {nombre}, ¿me pasas los {cantidad} de {concepto}?';

  it('sustituye las tres variables', () => {
    expect(
      buildReminderMessage({
        personName: 'Lucía Sanz',
        debts: [{ amountCents: 1500, concept: 'Entradas del concierto' }],
        tone: 'personalizada',
        customTemplate: custom,
      }),
    ).toBe('Oye Lucía, ¿me pasas los 15 € de entradas del concierto?');
  });

  it('se adapta cuando no hay un único concepto', () => {
    expect(
      buildReminderMessage({
        personName: 'Lucía Sanz',
        debts: [cena, cine],
        tone: 'personalizada',
        customTemplate: custom,
      }),
    ).toBe('Oye Lucía, ¿me pasas los 32,50 €?');
  });

  it('si está vacía recurre al tono amable', () => {
    expect(
      buildReminderMessage({
        ...pedro,
        debts: [cena],
        tone: 'personalizada',
        customTemplate: '  ',
      }),
    ).toContain('¡Hola, Pedro!');
  });

  it('quita "de {concepto}", "por la {concepto}" y "({concepto})"', () => {
    expect(withoutConceptVariant('Me debes {cantidad} de {concepto}.')).toBe(
      'Me debes {cantidad}.',
    );
    expect(withoutConceptVariant('{cantidad} por la {concepto}, porfa')).toBe('{cantidad}, porfa');
    expect(withoutConceptVariant('{cantidad} ({concepto})')).toBe('{cantidad}');
    expect(withoutConceptVariant('Acuérdate: {concepto}')).toBe(
      'Acuérdate: lo que tenemos pendiente',
    );
  });

  it('en Ajustes se edita la plantilla del tono activo', () => {
    expect(editableTemplate('directo', '')).toBe(
      '{nombre}, me debes {cantidad} de {concepto}. ¿Me lo pasas cuando puedas?',
    );
    expect(editableTemplate('personalizada', custom)).toBe(custom);
  });

  it('fillTemplate no distingue mayúsculas en las variables', () => {
    expect(fillTemplate('{Nombre}: {CANTIDAD}', { nombre: 'Ana', cantidad: '5 €' })).toBe(
      'Ana: 5 €',
    );
  });
});

describe('enlace de WhatsApp', () => {
  it('con teléfono abre el chat con el número sin el +', () => {
    expect(whatsappUrl('+34612345678', 'Hola, ¿qué tal?')).toBe(
      'https://wa.me/34612345678?text=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F',
    );
  });

  it('sin teléfono abre WhatsApp solo con el texto', () => {
    expect(whatsappUrl(null, '20 €')).toBe('https://wa.me/?text=20%20%E2%82%AC');
  });
});
