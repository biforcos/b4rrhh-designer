/**
 * La dirección de un recibo: su clave de negocio, las seis partes (`frontend#64`).
 *
 * **El número de presencia es la parte que se olvida.** `EMP000001` y `EMP000002` son readmisiones
 * viejas y tienen su recibo en la **presencia 2**: dar por hecho `1` acierta en 998 empleados de la
 * semilla y da 404 en dos. Por eso viaja en la URL y no se supone (`designer#8`, punto 1).
 */
export interface PayrollAddress {
  ruleSystemCode: string
  employeeTypeCode: string
  employeeNumber: string
  payrollPeriodCode: string
  payrollTypeCode: string
  presenceNumber: number
}

const PAYROLL_TYPE_CODES = ['NORMAL', 'EXTRA']

/**
 * La ruta de `GET /payrolls/.../steps` del `backend#97`.
 *
 * Las seis partes se escriben una a una y no con un `join`, y no es estilo: una ruta armada a
 * trozos no se puede comprobar leyendo el fuente, y `lint:api-paths` —el candado que el
 * `designer#11` montó para que ninguna llamada se salga del contrato— sólo puede ver la forma que
 * está escrita: un `join` la escondía, y una ruta partida en trozos concatenados también. Por eso
 * los seis nombres se acortan aquí, que es lo que permite que quepa en un literal y se vea entera.
 * Esconderla de la comprobación es exactamente lo que dejó a `/objects` fuera del contrato durante
 * meses.
 */
export function payrollStepsPath(address: PayrollAddress): string {
  const e = encodeURIComponent
  const { ruleSystemCode: rs, employeeTypeCode: et, employeeNumber: en } = address
  const { payrollPeriodCode: pp, payrollTypeCode: pt, presenceNumber: pn } = address
  return `/payrolls/${e(rs)}/${e(et)}/${e(en)}/${e(pp)}/${e(pt)}/${e(String(pn))}/steps`
}

/**
 * Lee la dirección de los parámetros de la ruta, o `null` si no puede ser la de ningún recibo.
 *
 * Nulo es «esta dirección es imposible» y se dice en pantalla; no es lo mismo que «el recibo no
 * está», que lo contesta el backend con un 404 y también se dice.
 */
export function readPayrollAddress(
  params: Readonly<Record<string, string | undefined>>,
): PayrollAddress | null {
  const ruleSystemCode = params.ruleSystemCode?.trim() ?? ''
  const employeeTypeCode = params.employeeTypeCode?.trim() ?? ''
  const employeeNumber = params.employeeNumber?.trim() ?? ''
  const payrollPeriodCode = params.payrollPeriodCode?.trim() ?? ''
  const payrollTypeCode = params.payrollTypeCode?.trim() ?? ''
  const presenceNumberRaw = params.presenceNumber?.trim() ?? ''

  if (!ruleSystemCode || !employeeTypeCode || !employeeNumber || !payrollPeriodCode) return null
  if (!PAYROLL_TYPE_CODES.includes(payrollTypeCode)) return null
  if (!/^\d+$/.test(presenceNumberRaw)) return null

  const presenceNumber = Number(presenceNumberRaw)
  if (presenceNumber <= 0) return null

  return {
    ruleSystemCode,
    employeeTypeCode,
    employeeNumber,
    payrollPeriodCode,
    payrollTypeCode,
    presenceNumber,
  }
}
