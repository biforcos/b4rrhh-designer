import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ReactElement } from 'react'
import { ReceiptCanvasPage } from './ReceiptCanvasPage'
import { RECEIPT_ROUTE_PATH } from '../../routes'
import { conceptsApi } from '../canvas/api/conceptsApi'
import { payrollStepsApi } from './api/payrollStepsApi'
import { ApiError } from '../../api/client'
import { FOCUS_CONCEPT_MESSAGE, NODE_CLICKED_MESSAGE } from './embedBridge'
import { resetFocusConceptChannelForTests } from './focusConceptChannel'
import type { PayrollStep } from './payrollStep'

/**
 * `<ReactFlow>` se monta de verdad, y en jsdom eso necesita los tres cacharros de medida que el
 * navegador trae y jsdom no. No miden nada: están para que el lienzo pueda montarse.
 */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver
globalThis.DOMMatrixReadOnly ??= class {
  m22 = 1
} as unknown as typeof DOMMatrixReadOnly
Element.prototype.scrollIntoView ??= function scrollIntoView() {}

vi.mock('../canvas/api/conceptsApi', () => ({
  conceptsApi: { listConcepts: vi.fn(), listOperands: vi.fn(), listFeeds: vi.fn() },
}))
vi.mock('./api/payrollStepsApi', () => ({
  payrollStepsApi: { listSteps: vi.fn() },
}))

const DIRECCION = '/recibo/ESP/INTERNAL/EMP000001/202609/NORMAL/2'

function wrap(ui: ReactElement, url = DIRECCION) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path={RECEIPT_ROUTE_PATH} element={ui} />
          <Route path="*" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const MNEMONICOS: Record<string, string> = {
  '101': 'SALARIO_BASE',
  '970': 'TOTAL_DEVENGOS',
  D01: 'DIAS_DEVENGO',
}

function concepto(conceptCode: string, calculationType = 'RATE_BY_QUANTITY') {
  return {
    ruleSystemCode: 'ESP',
    conceptCode,
    conceptMnemonic: MNEMONICOS[conceptCode] ?? conceptCode,
    calculationType,
    functionalNature: 'EARNING',
    executionScope: 'SEGMENT',
    payslipOrderCode: null,
    summary: null,
  }
}

function paso(
  partial: Partial<PayrollStep> & { executionOrder: number; conceptCode: string },
): PayrollStep {
  return {
    conceptMnemonic: partial.conceptCode,
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

beforeEach(() => {
  vi.clearAllMocks()
  window.localStorage.clear()
  // El canal es de modulo: sin esto, un mensaje guardado en un test se entregaria en el siguiente.
  resetFocusConceptChannelForTests()
  vi.mocked(conceptsApi.listConcepts).mockResolvedValue([
    concepto('101'),
    concepto('970', 'AGGREGATE'),
  ])
  vi.mocked(conceptsApi.listOperands).mockResolvedValue([])
  vi.mocked(conceptsApi.listFeeds).mockResolvedValue([])
})

describe('ReceiptCanvasPage: la dirección', () => {
  it('una dirección imposible se dice, y no se le pregunta nada al backend', async () => {
    wrap(<ReceiptCanvasPage />, '/recibo/ESP/INTERNAL/EMP000001/202609/NORMAL/0')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esta dirección no es la de ningún recibo',
    )
    expect(payrollStepsApi.listSteps).not.toHaveBeenCalled()
    expect(conceptsApi.listConcepts).not.toHaveBeenCalled()
  })

  it('pide los pasos con las seis partes de la dirección, incluida la presencia de la URL', async () => {
    vi.mocked(payrollStepsApi.listSteps).mockResolvedValue([
      paso({ executionOrder: 8, conceptCode: '101', amount: 712.5 }),
    ])

    wrap(<ReceiptCanvasPage />)

    await waitFor(() =>
      expect(payrollStepsApi.listSteps).toHaveBeenCalledWith({
        ruleSystemCode: 'ESP',
        employeeTypeCode: 'INTERNAL',
        employeeNumber: 'EMP000001',
        payrollPeriodCode: '202609',
        payrollTypeCode: 'NORMAL',
        presenceNumber: 2,
      }),
    )
  })
})

describe('ReceiptCanvasPage: los estados que no se pueden confundir', () => {
  it('mientras carga lo dice', () => {
    vi.mocked(payrollStepsApi.listSteps).mockReturnValue(new Promise(() => {}))

    wrap(<ReceiptCanvasPage />)

    expect(screen.getByText(/Cargando/)).toBeInTheDocument()
  })

  it('un grafo que no carga dice que no se sabe qué conceptos hay', async () => {
    vi.mocked(conceptsApi.listConcepts).mockRejectedValue(new ApiError(500, '/concepts'))
    vi.mocked(payrollStepsApi.listSteps).mockResolvedValue([])

    wrap(<ReceiptCanvasPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('No se ha podido cargar el grafo')
  })

  it('un recibo que no está en esa dirección lo dice, y recuerda la presencia', async () => {
    vi.mocked(payrollStepsApi.listSteps).mockRejectedValue(new ApiError(404, '/payrolls'))

    wrap(<ReceiptCanvasPage />)

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('No hay ningún recibo en esta dirección')
    expect(aviso).toHaveTextContent(/presencia/i)
  })

  it('una carga de pasos que falla no se confunde con un recibo que no está', async () => {
    vi.mocked(payrollStepsApi.listSteps).mockRejectedValue(new ApiError(500, '/payrolls'))

    wrap(<ReceiptCanvasPage />)

    // Un 500 sí se reintenta —puede ser un momento malo—, así que el aviso tarda lo que tardan los
    // dos intentos. El 404 de aquí al lado sale a la primera justo por no reintentarse.
    const aviso = await screen.findByRole('alert', {}, { timeout: 8000 })
    expect(aviso).toHaveTextContent('No se han podido cargar los pasos')
    expect(aviso).not.toHaveTextContent('No hay ningún recibo en esta dirección')
  })

  it('un recibo sin pasos no se queda en un lienzo vacío: dice por qué está vacío', async () => {
    vi.mocked(payrollStepsApi.listSteps).mockResolvedValue([])

    wrap(<ReceiptCanvasPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('no tiene pasos guardados')
  })

  it('un recibo sin pasos no pinta el grafo en gris: un nodo «no participó» por concepto sería falso', async () => {
    vi.mocked(payrollStepsApi.listSteps).mockResolvedValue([])

    wrap(<ReceiptCanvasPage />)

    await screen.findByRole('alert')
    expect(screen.queryByTestId('receipt-canvas')).not.toBeInTheDocument()
  })

  it('con pasos, pinta el lienzo y no ningún aviso', async () => {
    vi.mocked(payrollStepsApi.listSteps).mockResolvedValue([
      paso({ executionOrder: 8, conceptCode: '101', amount: 712.5 }),
      paso({ executionOrder: 10, conceptCode: '970', amount: 1068.75, executionScope: 'PERIOD' }),
    ])

    wrap(<ReceiptCanvasPage />)

    expect(await screen.findByTestId('receipt-canvas')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('ReceiptCanvasPage: en modo recibo no hay manera de escribir', () => {
  beforeEach(() => {
    vi.mocked(payrollStepsApi.listSteps).mockResolvedValue([
      paso({ executionOrder: 8, conceptCode: '101', amount: 712.5 }),
    ])
  })

  it('no hay ni Guardar ni alta de concepto: no están, no están apagados', async () => {
    wrap(<ReceiptCanvasPage />)
    await screen.findByTestId('receipt-canvas')

    expect(screen.queryByRole('button', { name: /Guardar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Concepto/ })).not.toBeInTheDocument()
  })

  it('tampoco el lápiz del summary de los nodos', async () => {
    wrap(<ReceiptCanvasPage />)
    await screen.findByTestId('receipt-canvas')

    expect(screen.queryByTitle('Editar summary')).not.toBeInTheDocument()
  })
})

describe('ReceiptCanvasPage: los dos mensajes con quien lo embebe', () => {
  const PASOS = [
    paso({ executionOrder: 8, conceptCode: '101', amount: 712.5 }),
    paso({ executionOrder: 10, conceptCode: '970', amount: 1068.75, executionScope: 'PERIOD' }),
  ]

  beforeEach(() => {
    vi.mocked(payrollStepsApi.listSteps).mockResolvedValue(PASOS)
  })

  it('pinchar un nodo avisa a quien embebe, con el código del concepto', async () => {
    const postMessage = vi.fn()
    Object.defineProperty(window, 'parent', {
      value: { postMessage },
      configurable: true,
    })

    wrap(<ReceiptCanvasPage />)
    fireEvent.click(await screen.findByText('SALARIO_BASE'))

    expect(postMessage).toHaveBeenCalledWith(
      { type: NODE_CLICKED_MESSAGE, conceptCode: '101' },
      window.location.origin,
    )

    Object.defineProperty(window, 'parent', { value: window, configurable: true })
  })

  it('un «céntrate en este concepto» abre ese concepto, sin que nadie haya pinchado el lienzo', async () => {
    wrap(<ReceiptCanvasPage />)
    await screen.findByTestId('receipt-canvas')

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: FOCUS_CONCEPT_MESSAGE, conceptCode: '970' },
          origin: window.location.origin,
        }),
      )
    })

    const panel = await screen.findByRole('complementary')
    expect(panel).toHaveTextContent('Este recibo')
    expect(panel).toHaveTextContent('TOTAL_DEVENGOS')
    expect(panel).toHaveTextContent('1068,75')
  })
})

describe('ReceiptCanvasPage: de dónde sale este número', () => {
  it('seleccionar un concepto enciende su camino y atenúa lo que no está en él', async () => {
    // Es el recorrido que contesta «de dónde sale este número» sin leer una fila de texto
    // (`designer#8`, punto 4). El 101 alimenta al 970; D01 no tiene nada que ver.
    vi.mocked(conceptsApi.listConcepts).mockResolvedValue([
      concepto('101'),
      concepto('970', 'AGGREGATE'),
      concepto('D01', 'ENGINE_PROVIDED'),
    ])
    vi.mocked(conceptsApi.listOperands).mockImplementation(async (_rs, conceptCode) =>
      conceptCode === '970' ? [{ operandRole: 'QUANTITY', sourceObjectCode: '101' }] : [],
    )
    vi.mocked(payrollStepsApi.listSteps).mockResolvedValue([
      paso({ executionOrder: 1, conceptCode: 'D01', amount: 15 }),
      paso({ executionOrder: 8, conceptCode: '101', amount: 712.5 }),
      paso({ executionOrder: 10, conceptCode: '970', amount: 1068.75, executionScope: 'PERIOD' }),
    ])

    wrap(<ReceiptCanvasPage />)
    fireEvent.click(await screen.findByText('TOTAL_DEVENGOS'))

    expect(nodeBoxOf('SALARIO_BASE')).not.toHaveClass('opacity-[0.12]')
    expect(nodeBoxOf('DIAS_DEVENGO')).toHaveClass('opacity-[0.12]')
  })
})

/** La caja del nodo que lleva ese mnemónico: el `<div>` con el borde y la opacidad. */
function nodeBoxOf(mnemonic: string): HTMLElement {
  const box = screen.getByText(mnemonic).closest('[class*="rounded-md"]')
  if (!(box instanceof HTMLElement)) throw new Error(`sin caja para ${mnemonic}`)
  return box
}

describe('ReceiptCanvasPage: la altura', () => {
  it('se da su propia altura de pantalla, porque no cuelga del AppShell', async () => {
    // El lienzo se monta igual sin ella, pero mide 0×0: el `fitView` encuadra sobre la nada y la
    // página sale en blanco con los nodos fuera. jsdom no maqueta, así que esto no se puede ver en
    // un test —se vio en el navegador— y lo que queda aquí es el candado.
    vi.mocked(payrollStepsApi.listSteps).mockResolvedValue([
      paso({ executionOrder: 8, conceptCode: '101', amount: 712.5 }),
    ])

    const { container } = wrap(<ReceiptCanvasPage />)
    await screen.findByTestId('receipt-canvas')

    expect(container.firstElementChild).toHaveClass('h-screen')
  })

  it('también cuando lo que pinta es un aviso y no el lienzo', async () => {
    vi.mocked(payrollStepsApi.listSteps).mockResolvedValue([])

    const { container } = wrap(<ReceiptCanvasPage />)
    await screen.findByRole('alert')

    expect(container.firstElementChild).toHaveClass('h-screen')
  })
})

describe('ReceiptCanvasPage: el «Cargando» ocupa la pantalla', () => {
  it('el mensaje de carga se reparte el ancho del marco, no se queda sin él', async () => {
    // El marco es un flex: un hijo sin `flex-1` se queda a ancho cero y el texto sale pegado al
    // borde izquierdo en vez de centrado. Visto en el navegador; esto es el candado.
    vi.mocked(payrollStepsApi.listSteps).mockReturnValue(new Promise(() => {}))

    wrap(<ReceiptCanvasPage />)

    expect(screen.getByText(/Cargando/)).toHaveClass('flex-1')
  })
})
