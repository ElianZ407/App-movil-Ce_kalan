
const { calcularDosis } = require('./calcularDosis');


//  1. Caso ideal

describe(' Caso ideal — Cálculo con valores normales', () => {

    test('Terreno de 100m × 50m con dosis de 200 mL/ha da 100 mL', () => {

        const resultado = calcularDosis(100, 50, 200);
        expect(resultado).toBe(100);
    });

    test('Terreno de 200m × 300m con dosis de 500 g/ha da 3 000 g', () => {

        const resultado = calcularDosis(200, 300, 500);
        expect(resultado).toBe(3000);
    });

    test('Terreno de 1 hectárea (100m × 100m) conserva la dosis completa', () => {
        /*
         * área     = 100 × 100 = 10 000 m² = 1 ha
         */
        const resultado = calcularDosis(100, 100, 150);
        expect(resultado).toBe(150);
    });
});

//  2. Caso limite

describe(' Caso limite — Valores extremos o de borde', () => {

    test('Si el ancho es 0, el resultado debe ser 0 (área nula)', () => {
        
        const resultado = calcularDosis(0, 50, 200);
        expect(resultado).toBe(0);
    });

    test('Si la dosis es 0, el resultado debe ser 0 ', () => {
        const resultado = calcularDosis(100, 50, 0);
        expect(resultado).toBe(0);
    });

    test('Valores negativos generan un resultado negativo ', () => {

        const resultado = calcularDosis(-10, 50, 200);
        expect(resultado).toBe(-10);
    });

    test('Decimales muy pequeños devuelven un resultado de punto flotante', () => {

        const resultado = calcularDosis(0.5, 0.5, 100);
        expect(resultado).toBeCloseTo(0.0025, 6);
    });

    test('Terreno enorme (10 km × 10 km) no genera desbordamiento', () => {

        const resultado = calcularDosis(10000, 10000, 200);
        expect(resultado).toBe(2000000);
    });
});


//  3. Caso error intencional

describe('Error Intencional — Parámetros con tipos incorrectos', () => {

    test('[ERROR] Pasar texto "cien" en lugar del ancho numérico', () => {

        const resultado = calcularDosis('cien', 50, 200);
        expect(resultado).toBe(100);
    });

    test('[ERROR] Pasar null como dosis', () => {

        const resultado = calcularDosis(100, 50, null);
        expect(resultado).toBe(0);
    });

    test('[ERROR] Pasar undefined como largo', () => {

        const resultado = calcularDosis(100, undefined, 200);
        expect(resultado).toBe(2);
    });
});
