import type { PayrollStep } from './payrollStep'

/**
 * Lo que un recibo concreto dice de un concepto del grafo.
 *
 * Son tres formas y no dos porque «no participó» es un hecho del recibo, no la ausencia de uno:
 * un hueco en blanco se lee como cero (`designer#8`, punto 2).
 *
 * **`segmented` no lleva importe propio, y es a propósito.** El punto 3 del `designer#8` proponía
 * enseñar el valor de período del nodo y marcar que venía de dos tramos. Con los pasos delante no
 * se sostiene: en el mes partido de la semilla repiten cuatro conceptos, y la suma sólo significa
 * algo en dos. `101` SALARIO_BASE suma 712,50 + 356,25 = 1.068,75, que es el devengo de verdad;
 * `D01` DIAS_DEVENGO suma 15 + 15 = 30 días. Pero `J01` COEFICIENTE_JORNADA son 1,00 y 0,50, y
 * 1,5 no es ninguna jornada; `P01` PRECIO_DIA son 47,50 y 23,75, y 71,25 no es ningún precio.
 *
 * Una regla «suma y márcalo» fabrica un número en la mitad de los casos. Una regla «suma sólo
 * las naturalezas que suman» mete en el lienzo un conocimiento que es del motor. Así que no se
 * suma en ningún sitio: el nodo enseña un tramo por fila. Y el total de período que alguien busca
 * para el `101` ya existe como nodo propio —`970` TOTAL_DEVENGOS, calculado por el motor—, así que
 * el lienzo no tiene que inventarlo.
 */
export type ReceiptNodeValue =
  | { kind: 'absent' }
  | { kind: 'single'; step: PayrollStep }
  | { kind: 'segmented'; steps: readonly PayrollStep[] }

/** El concepto está en el grafo y no en los pasos: no participó en este recibo. */
export const NOT_IN_RECEIPT: ReceiptNodeValue = { kind: 'absent' }

/**
 * Agrupa los pasos por concepto. Un paso da `single`; dos o más, `segmented` en orden de
 * ejecución, que es el orden en el que el motor los dio y el único que los explica.
 */
export function buildReceiptValues(
  steps: readonly PayrollStep[],
): ReadonlyMap<string, ReceiptNodeValue> {
  const byConcept = new Map<string, PayrollStep[]>()
  for (const step of steps) {
    const previous = byConcept.get(step.conceptCode)
    if (previous) previous.push(step)
    else byConcept.set(step.conceptCode, [step])
  }

  const values = new Map<string, ReceiptNodeValue>()
  for (const [conceptCode, conceptSteps] of byConcept) {
    if (conceptSteps.length === 1) {
      values.set(conceptCode, { kind: 'single', step: conceptSteps[0] })
    } else {
      const ordered = [...conceptSteps].sort((a, b) => a.executionOrder - b.executionOrder)
      values.set(conceptCode, { kind: 'segmented', steps: ordered })
    }
  }
  return values
}

/** El valor de un concepto, y «no participó» cuando no hay ninguno. */
export function receiptValueOf(
  values: ReadonlyMap<string, ReceiptNodeValue>,
  conceptCode: string,
): ReceiptNodeValue {
  return values.get(conceptCode) ?? NOT_IN_RECEIPT
}
