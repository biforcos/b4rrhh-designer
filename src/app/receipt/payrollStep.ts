/**
 * Un paso del cálculo de un recibo, tal y como lo sirve `GET /payrolls/.../steps`
 * (`b4rrhh/backend#97`).
 *
 * **La identidad de una fila es `executionOrder`, no `conceptCode`.** Un concepto de ámbito
 * `SEGMENT` se evalúa una vez por segmento: en el mes partido de la semilla, cuatro conceptos
 * —`101`, `D01`, `J01` y `P01`— dejan dos pasos cada uno. Indexar por código enseña uno y se
 * come el otro.
 */
export interface PayrollStep {
  executionOrder: number
  conceptCode: string
  conceptMnemonic: string
  calculationType: string
  functionalNature: string
  executionScope: string
  segmentStartDate: string | null
  segmentEndDate: string | null
  amount: number
  quantity: number | null
  rate: number | null
  payslipOrderCode: string | null
}
