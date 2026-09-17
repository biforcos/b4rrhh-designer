import { readPayrollAddress, type PayrollAddress } from '../receipt/payrollAddress'

/**
 * La dirección con la que se aterriza en una fila de tabla, y con la que se sabe volver
 * (`designer#13`).
 *
 * Son tres parámetros sobre la pantalla de tablas de siempre, no una pantalla nueva:
 *
 * ```
 * /designer/objects?tabla=P02_99002405011982&fila=7&recibo=ESP/INTERNAL/EMP001000/202609/NORMAL/2
 * ```
 *
 * `tabla` y `fila` dicen dónde aterrizar. `recibo` dice de dónde se viene, y es lo único que hace
 * falta para la miga de vuelta: mientras esté, el designer sabe a qué recibo volver.
 *
 * **Los tres nombres se escriben aquí y se leen desde el otro lado.** Quien construye la dirección
 * es el recibo del backoffice, que vive en otro repositorio: si alguno de los dos cambia un nombre,
 * lo que se rompe es el salto, en silencio y sólo en el navegador. Es la misma frontera —y el mismo
 * riesgo— que los dos mensajes de `embedBridge.ts`.
 */
export const PARAM_TABLA = 'tabla'
export const PARAM_FILA = 'fila'
export const PARAM_RECIBO = 'recibo'

export interface AterrizajeEnFila {
  /** La tabla que hay que abrir. Sin ella no hay aterrizaje: una fila suelta no es una dirección. */
  tableCode: string
  /**
   * La fila que hay que señalar, o `null` si la dirección sólo nombra la tabla.
   *
   * Nulo no es un error: abrir una tabla entera es una dirección legítima. Lo que no existe es lo
   * contrario —una fila sin su tabla—, porque la pantalla se abre por tabla.
   */
  rowId: number | null
}

/**
 * Lee el aterrizaje de la consulta, o `null` si esta dirección no nombra ninguna tabla.
 *
 * Una `fila` que no sea un entero positivo se descarta y se conserva la tabla: es mejor abrir la
 * tabla sin señalar nada que no abrir nada por un número mal escrito.
 */
export function leerAterrizaje(params: URLSearchParams): AterrizajeEnFila | null {
  const tableCode = params.get(PARAM_TABLA)?.trim() ?? ''
  if (!tableCode) return null

  const filaRaw = params.get(PARAM_FILA)?.trim() ?? ''
  const rowId = /^\d+$/.test(filaRaw) && Number(filaRaw) > 0 ? Number(filaRaw) : null

  return { tableCode, rowId }
}

/**
 * Lee el recibo de origen de la consulta, o `null` si no viene ninguno o viene imposible.
 *
 * Las seis partes van en un solo parámetro separadas por `/`, que es como se escribe la dirección
 * de un recibo en todas partes (`frontend#64`). El número de presencia es la parte que se olvida:
 * `EMP000001` tiene su recibo en la presencia 2.
 */
export function leerReciboDeOrigen(params: URLSearchParams): PayrollAddress | null {
  const crudo = params.get(PARAM_RECIBO)?.trim() ?? ''
  if (!crudo) return null

  const partes = crudo.split('/')
  if (partes.length !== 6) return null

  return readPayrollAddress({
    ruleSystemCode: partes[0],
    employeeTypeCode: partes[1],
    employeeNumber: partes[2],
    payrollPeriodCode: partes[3],
    payrollTypeCode: partes[4],
    presenceNumber: partes[5],
  })
}

/** Las seis partes de un recibo tal y como viajan en el parámetro `recibo`. */
export function escribirReciboDeOrigen(address: PayrollAddress): string {
  return [
    address.ruleSystemCode,
    address.employeeTypeCode,
    address.employeeNumber,
    address.payrollPeriodCode,
    address.payrollTypeCode,
    String(address.presenceNumber),
  ].join('/')
}
