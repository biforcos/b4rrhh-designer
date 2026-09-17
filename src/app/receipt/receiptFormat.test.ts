import { describe, it, expect } from "vitest";
import { formatSegment, formatValue } from "./receiptFormat";

/**
 * El `b4rrhh/backend#106`, por el lado del grafo: **el nodo y el panel enseñan la precisión que se
 * usó**, que es la misma que enseña el folio del backoffice.
 *
 * El caso es el de `EMP000003`, presencia 1, período `202609` — el mes partido con categoría `G1`,
 * y el único de los 873 recibos de la semilla donde la tarifa redondeada y la real dan importes
 * distintos: `15 × 30,84 = 462,60` frente a `15 × 30,835 = 462,53`, que es el que el motor guardó.
 *
 * Los dos primeros tests van por separado a propósito. Uno que mirase sólo el caso difícil pasaría
 * con una implementación que pintase siempre tres decimales, y uno que mirase sólo el fácil pasaría
 * sin arreglar nada. La otra mitad del criterio 4 —que el folio diga esto mismo— la sujeta
 * `recibos-precision-de-la-tarifa.spec.ts` en el backoffice: ninguna prueba abarca los dos
 * repositorios.
 */
describe("formatValue", () => {
  it("una tarifa con tres decimales los enseña, y así la línea cuadra", () => {
    expect(formatValue(30.835)).toBe("30,835");
  });

  it("una tarifa exacta sigue saliendo con sus dos decimales", () => {
    expect(formatValue(61.67)).toBe("61,67");
    expect(formatValue(15)).toBe("15,00");
    expect(formatValue(925.05)).toBe("925,05");
  });

  /**
   * Seis es el techo real y no un margen elegido a ojo: el esquema acota `rounding_scale` entre 0 y
   * 6, así que ningún valor del recibo puede traer un decimal más. No hay ninguno así en la semilla
   * —el peor caso vivo tiene tres— y por eso hay que fabricarlo: sin esto, «pintar tres» pasa.
   */
  it("seis decimales se enseñan los seis", () => {
    expect(formatValue(1.234567)).toBe("1,234567");
    expect(formatValue(0.333333)).toBe("0,333333");
  });

  /**
   * Lo que no cambia. La agrupación es la de `es-ES` y en español un número de cuatro cifras va
   * sin punto: la base de cotización se escribe `1847,40` y no `1.847,40`. Ya era así antes de
   * tocar los decimales, y está aquí para que se vea que sigue siéndolo.
   */
  it("la agrupación de miles es la de es-ES y no se ha movido", () => {
    expect(formatValue(1847.4)).toBe("1847,40");
    expect(formatValue(18474.4)).toBe("18.474,40");
  });
});

describe("formatSegment", () => {
  it("escribe el tramo sin el año, que es el mismo en los dos extremos", () => {
    expect(formatSegment("2026-09-01", "2026-09-15", 1)).toBe("01/09 – 15/09");
  });

  it("un paso sin segmento se nombra por su orden", () => {
    expect(formatSegment(null, null, 2)).toBe("Tramo 2");
  });
});
