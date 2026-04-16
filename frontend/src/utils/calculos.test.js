import { calcularDosis } from './calculos';

describe('calcularDosis', () => {
  test('caso ideal: valores correctos', () => {
    const { area, resultado } = calcularDosis('4', '5', '20');
    expect(area).toBe(20);
    expect(resultado).toBeCloseTo(0.04, 5);
  });

  test('caso límite: valor 0 o negativo lanza error', () => {
    expect(() => calcularDosis('0', '10', '10')).toThrow('positivos');
    expect(() => calcularDosis('-2', '10', '10')).toThrow('positivos');
    expect(() => calcularDosis('10', '0', '1')).toThrow('positivos');
  });

  test('caso error intencional: texto en lugar de número', () => {
    expect(() => calcularDosis('abc', '5', '10')).toThrow('numéricos');
    expect(() => calcularDosis('3', 'x', '10')).toThrow('numéricos');
    expect(() => calcularDosis('3', '5', 'p')).toThrow('numéricos');
  });
});