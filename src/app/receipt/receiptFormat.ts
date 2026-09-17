/**
 * Un número del recibo, escrito con la precisión que se usó (`b4rrhh/backend#106`).
 *
 * Esto se llamaba `formatAmount` y fijaba dos decimales, y lo usaban también la cantidad y la
 * tarifa — que es donde el nombre dejó de ser cierto y el número dejó de cuadrar. El mes partido
 * de `EMP000003` se leía `15,00 × 30,84` con un importe de `462,53`, y la tarifa real es `30,835`:
 * la mitad de `61,67`, que es el precio día pleno de `G1`. El importe era el correcto; la pantalla
 * era la que se había quedado atrás.
 *
 * El principio es del `backend#61`: **se enseña la precisión que se usó**. El concepto declara con
 * cuántos decimales se queda —`rounding_scale`, que el esquema acota entre 0 y 6— y el paso
 * guardado los lleva, así que el seis no es un margen a ojo sino ese techo.
 *
 * Es una sola función para los tres números del nodo y para los tres de la tabla del panel, y el
 * backoffice tiene la suya en `recibos.format.ts` con el mismo criterio: el grafo y el folio
 * enseñan los mismos valores, y **una precisión por pantalla es como empezó esto**.
 */
const VALUE = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
})

export function formatValue(value: number): string {
  return VALUE.format(value)
}

/**
 * El tramo de un paso, en corto: `01/09 – 15/09`. El año sobra porque los dos extremos son del
 * mismo período, y en un nodo del lienzo cada carácter cuesta.
 */
export function formatSegment(
  startDate: string | null,
  endDate: string | null,
  ordinal: number,
): string {
  if (startDate === null || endDate === null) return `Tramo ${ordinal}`
  return `${shortDate(startDate)} – ${shortDate(endDate)}`
}

function shortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-')
  return `${day}/${month}`
}
