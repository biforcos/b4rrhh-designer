import { describe, it, expect } from 'vitest'
import { buildReceiptValues, NOT_IN_RECEIPT, receiptValueOf } from './receiptValues'
import type { PayrollStep } from './payrollStep'

function step(partial: Partial<PayrollStep> & { executionOrder: number; conceptCode: string }): PayrollStep {
  return {
    conceptMnemonic: partial.conceptCode,
    calculationType: 'RATE_BY_QUANTITY',
    functionalNature: 'EARNING',
    executionScope: 'PERIOD',
    segmentStartDate: null,
    segmentEndDate: null,
    amount: 0,
    quantity: null,
    rate: null,
    payslipOrderCode: null,
    ...partial,
  }
}

describe('buildReceiptValues', () => {
  it('un concepto con un solo paso queda como «single» con ese paso', () => {
    const values = buildReceiptValues([step({ executionOrder: 11, conceptCode: 'B01', amount: 1068.75 })])

    const b01 = values.get('B01')
    expect(b01).toEqual({ kind: 'single', step: expect.objectContaining({ amount: 1068.75 }) })
  })

  it('un concepto con dos pasos queda como «segmented» con los dos', () => {
    const values = buildReceiptValues([
      step({ executionOrder: 8, conceptCode: '101', amount: 712.5, executionScope: 'SEGMENT' }),
      step({ executionOrder: 9, conceptCode: '101', amount: 356.25, executionScope: 'SEGMENT' }),
    ])

    const salario = values.get('101')
    expect(salario?.kind).toBe('segmented')
    expect(salario?.kind === 'segmented' && salario.steps.map((s) => s.amount)).toEqual([712.5, 356.25])
  })

  it('los pasos de un concepto segmentado salen en orden de ejecución aunque lleguen al revés', () => {
    const values = buildReceiptValues([
      step({ executionOrder: 7, conceptCode: 'P01', amount: 23.75, executionScope: 'SEGMENT' }),
      step({ executionOrder: 6, conceptCode: 'P01', amount: 47.5, executionScope: 'SEGMENT' }),
    ])

    const precio = values.get('P01')
    expect(precio?.kind === 'segmented' && precio.steps.map((s) => s.executionOrder)).toEqual([6, 7])
  })

  it('no inventa ningún total: el valor segmentado no lleva importe propio', () => {
    // 1,00 y 0,50 de COEFICIENTE_JORNADA suman 1,5, que no es ninguna jornada. La decisión del
    // punto 3 de designer#8 es que ese número no se calcula en ningún sitio, ni aquí ni en el nodo.
    const values = buildReceiptValues([
      step({ executionOrder: 3, conceptCode: 'J01', amount: 1, executionScope: 'SEGMENT' }),
      step({ executionOrder: 4, conceptCode: 'J01', amount: 0.5, executionScope: 'SEGMENT' }),
    ])

    const jornada = values.get('J01')!
    expect(Object.keys(jornada).sort()).toEqual(['kind', 'steps'])
  })
})

describe('receiptValueOf', () => {
  it('un concepto del grafo que no está en los pasos no participó en este recibo', () => {
    const values = buildReceiptValues([step({ executionOrder: 1, conceptCode: 'D01' })])

    expect(receiptValueOf(values, '999')).toBe(NOT_IN_RECEIPT)
  })

  it('un concepto que sí está devuelve su valor, no el de «no participó»', () => {
    const values = buildReceiptValues([step({ executionOrder: 1, conceptCode: 'D01', amount: 15 })])

    expect(receiptValueOf(values, 'D01').kind).toBe('single')
  })
})
