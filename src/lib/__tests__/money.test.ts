import {
  applyKeypadKey,
  centsToInput,
  formatAmount,
  formatInput,
  formatMoney,
  formatMoneyCompact,
  inputToCents,
  sumCents,
  type KeypadKey,
} from '../money';

function type(keys: KeypadKey[], start = ''): string {
  return keys.reduce((value, key) => applyKeypadKey(value, key), start);
}

describe('formato de dinero', () => {
  it('muestra siempre dos decimales con coma y el símbolo detrás', () => {
    expect(formatMoney(14750)).toBe('147,50 €');
    expect(formatMoney(6000)).toBe('60,00 €');
    expect(formatMoney(5)).toBe('0,05 €');
    expect(formatMoney(0)).toBe('0,00 €');
  });

  it('separa los miles con punto en cantidades grandes', () => {
    expect(formatMoney(1234550)).toBe('12.345,50 €');
  });

  it('usa un espacio corriente, no un espacio duro', () => {
    expect(formatMoney(14750)).not.toMatch(/\s(?<! )/);
    expect(formatMoney(14750).charCodeAt(6)).toBe(32);
  });

  it('en formato compacto quita los decimales de las cantidades redondas', () => {
    expect(formatMoneyCompact(6000)).toBe('60 €');
    expect(formatMoneyCompact(3250)).toBe('32,50 €');
    expect(formatMoneyCompact(1500)).toBe('15 €');
  });

  it('devuelve la cifra sin símbolo para las cantidades grandes', () => {
    expect(formatAmount(14750)).toBe('147,50');
    expect(formatAmount(2000)).toBe('20,00');
  });
});

describe('suma en céntimos', () => {
  it('suma enteros sin errores de coma flotante', () => {
    // 0,10 € + 0,20 € en decimales daría 0,30000000000000004.
    expect(sumCents([10, 20])).toBe(30);
    expect(sumCents([2500, 2000, 1500, 2000, 1250, 2750, 1500, 1250])).toBe(14750);
  });

  it('la lista vacía suma cero', () => {
    expect(sumCents([])).toBe(0);
  });

  it('sigue siendo exacta con muchas cantidades pequeñas', () => {
    expect(sumCents(Array.from({ length: 1000 }, () => 1))).toBe(1000);
    expect(sumCents(Array.from({ length: 3 }, () => 3333))).toBe(9999);
  });
});

describe('teclado numérico', () => {
  it('compone una cantidad con decimales', () => {
    expect(type(['2', '0', ',', '5'])).toBe('20,5');
    expect(inputToCents('20,5')).toBe(2050);
    expect(inputToCents('20,50')).toBe(2050);
    expect(inputToCents('20,05')).toBe(2005);
  });

  it('no admite más de dos decimales ni dos comas', () => {
    expect(type(['1', ',', '2', '3', '4'])).toBe('1,23');
    expect(type(['1', ',', ','])).toBe('1,');
  });

  it('empezar por la coma equivale a cero coma', () => {
    expect(type([',', '5'])).toBe('0,5');
    expect(inputToCents('0,5')).toBe(50);
  });

  it('no deja ceros a la izquierda', () => {
    expect(type(['0', '0', '7'])).toBe('7');
  });

  it('limita la parte entera a seis cifras', () => {
    expect(type(['1', '2', '3', '4', '5', '6', '7'])).toBe('123456');
  });

  it('borra de uno en uno', () => {
    expect(type(['del'], '20,5')).toBe('20,');
    expect(type(['del', 'del', 'del', 'del', 'del'], '20,5')).toBe('');
  });

  it('convierte entre céntimos y texto sin pasar por decimales', () => {
    expect(inputToCents('')).toBe(0);
    expect(inputToCents('147')).toBe(14700);
    expect(centsToInput(14750)).toBe('147,50');
    expect(centsToInput(2000)).toBe('20');
    expect(centsToInput(2005)).toBe('20,05');
    expect(inputToCents(centsToInput(99999))).toBe(99999);
  });

  it('pinta lo que se va tecleando', () => {
    expect(formatInput('')).toBe('0,00');
    expect(formatInput('20')).toBe('20');
    expect(formatInput('20,')).toBe('20,');
    expect(formatInput('20,5')).toBe('20,5');
  });
});
