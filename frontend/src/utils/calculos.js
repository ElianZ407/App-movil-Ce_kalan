// frontend/src/utils/calculos.js
export const calcularDosis = (ancho, largo, dosis) => {
  if (ancho === '' || largo === '' || dosis === '' ||
      ancho == null || largo == null || dosis == null) {
    throw new Error('Todos los valores son obligatorios');
  }

  const a = Number(ancho);
  const l = Number(largo);
  const d = Number(dosis);

  if (Number.isNaN(a) || Number.isNaN(l) || Number.isNaN(d)) {
    throw new Error('Valores deben ser numéricos');
  }

  if (a <= 0 || l <= 0 || d <= 0) {
    throw new Error('Valores deben ser positivos');
  }

  const area = a * l;
  const resultado = (area * d) / 10000; // L
  return { ancho: a, largo: l, dosis: d, area, resultado };
};