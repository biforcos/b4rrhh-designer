import { render, screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { ConceptNode } from './ConceptNode'
import { NOT_IN_RECEIPT, type ReceiptNodeValue } from '../../receipt/receiptValues'
import type { PayrollStep } from '../../receipt/payrollStep'
import type { ConceptNodeData } from '../types'

function step(partial: Partial<PayrollStep> & { executionOrder: number }): PayrollStep {
  return {
    conceptCode: '101',
    conceptMnemonic: 'SALARIO_BASE',
    calculationType: 'RATE_BY_QUANTITY',
    functionalNature: 'EARNING',
    executionScope: 'SEGMENT',
    segmentStartDate: null,
    segmentEndDate: null,
    amount: 0,
    quantity: null,
    rate: null,
    payslipOrderCode: null,
    ...partial,
  }
}

function renderNode(receipt: ReceiptNodeValue | undefined, data: Partial<ConceptNodeData> = {}) {
  return render(
    <ReactFlowProvider>
      <ConceptNode
        id="101"
        data={{
          conceptCode: '101',
          conceptMnemonic: 'SALARIO_BASE',
          calculationType: 'RATE_BY_QUANTITY',
          functionalNature: 'EARNING',
          executionScope: 'SEGMENT',
          payslipOrderCode: null,
          summary: null,
          receipt,
          ...data,
        }}
        selected={false} type="concept" dragging={false} draggable={true} selectable={true}
        deletable={true} zIndex={0} isConnectable={true} positionAbsoluteX={0} positionAbsoluteY={0}
      />
    </ReactFlowProvider>,
  )
}

describe('ConceptNode en modo recibo', () => {
  it('sin valor de recibo no pinta nada de recibo: el lienzo de edición queda como estaba', () => {
    renderNode(undefined)

    expect(screen.queryByTestId('receipt-value')).not.toBeInTheDocument()
  })

  it('un concepto que no participó lo dice, no lo deja en blanco', () => {
    renderNode(NOT_IN_RECEIPT)

    expect(screen.getByTestId('receipt-value')).toHaveTextContent('No participó')
  })

  it('un paso único enseña su importe', () => {
    renderNode({ kind: 'single', step: step({ executionOrder: 11, amount: 1068.75 }) })

    expect(screen.getByTestId('receipt-value')).toHaveTextContent('1068,75')
  })

  it('un paso único con cantidad y tarifa las enseña junto al importe', () => {
    renderNode({
      kind: 'single',
      step: step({ executionOrder: 19, amount: 62.18, quantity: 1323, rate: 4.7 }),
    })

    expect(screen.getByTestId('receipt-value')).toHaveTextContent('1323,00 × 4,70')
  })

  it('dos pasos: un tramo por fila, con sus fechas y su importe', () => {
    renderNode({
      kind: 'segmented',
      steps: [
        step({ executionOrder: 8, amount: 712.5, quantity: 15, rate: 47.5, segmentStartDate: '2026-09-01', segmentEndDate: '2026-09-15' }),
        step({ executionOrder: 9, amount: 356.25, quantity: 15, rate: 23.75, segmentStartDate: '2026-09-16', segmentEndDate: '2026-09-30' }),
      ],
    })

    const value = screen.getByTestId('receipt-value')
    expect(value).toHaveTextContent('01/09 – 15/09')
    expect(value).toHaveTextContent('712,50')
    expect(value).toHaveTextContent('16/09 – 30/09')
    expect(value).toHaveTextContent('356,25')
  })

  it('dos pasos llevan la marca de cuántos tramos, que es lo que impide leerlo como un cálculo simple', () => {
    renderNode({
      kind: 'segmented',
      steps: [
        step({ executionOrder: 8, amount: 712.5 }),
        step({ executionOrder: 9, amount: 356.25 }),
      ],
    })

    expect(screen.getByTestId('receipt-value')).toHaveTextContent('2 tramos')
  })

  it('no enseña la suma de los tramos ni cuando sumarlos significaría algo', () => {
    // 712,50 + 356,25 = 1068,75 es el devengo de verdad, y aun así no va en el nodo: va en el
    // 970, que es quien lo calcula. Si el nodo lo pintara, la regla tendría que valer también
    // para J01 y P01, donde la suma no es nada.
    renderNode({
      kind: 'segmented',
      steps: [
        step({ executionOrder: 8, amount: 712.5 }),
        step({ executionOrder: 9, amount: 356.25 }),
      ],
    })

    expect(screen.getByTestId('receipt-value')).not.toHaveTextContent('1068,75')
  })

  it('tampoco suma un coeficiente: 1,00 y 0,50 no se convierten en 1,50', () => {
    renderNode(
      {
        kind: 'segmented',
        steps: [
          step({ executionOrder: 3, conceptCode: 'J01', amount: 1 }),
          step({ executionOrder: 4, conceptCode: 'J01', amount: 0.5 }),
        ],
      },
      { conceptCode: 'J01', conceptMnemonic: 'COEFICIENTE_JORNADA', functionalNature: 'TECHNICAL', calculationType: 'ENGINE_PROVIDED' },
    )

    const value = screen.getByTestId('receipt-value')
    expect(value).toHaveTextContent('1,00')
    expect(value).toHaveTextContent('0,50')
    expect(value).not.toHaveTextContent('1,50')
  })

  it('en modo recibo no hay camino de escritura: el lápiz del summary no existe', () => {
    renderNode(NOT_IN_RECEIPT)

    expect(screen.queryByTitle('Editar summary')).not.toBeInTheDocument()
  })
})
