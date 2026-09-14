/** Los importes del recibo se escriben como los escribe el recibo: es-ES y dos decimales. */
const AMOUNT = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatAmount(value: number): string {
  return AMOUNT.format(value)
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
