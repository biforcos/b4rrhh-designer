import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ReactElement, ReactNode } from 'react'
import { CanvasPage } from './CanvasPage'
import { conceptsApi } from './api/conceptsApi'

/**
 * Los dos silencios del `designer#9`, vistos desde la pantalla.
 *
 * El caso del guardado monta `<ReactFlow>` de verdad, y en jsdom eso necesita los tres cacharros
 * de medida que el navegador trae y jsdom no. No miden nada —aquí no se mira ninguna posición—:
 * están para que el lienzo pueda montarse y el botón de Guardar exista.
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

vi.mock('./api/conceptsApi', () => ({
  conceptsApi: {
    listConcepts: vi.fn(),
    listOperands: vi.fn(),
    listFeeds: vi.fn(),
    replaceOperands: vi.fn(),
    replaceFeeds: vi.fn(),
    updateSummary: vi.fn(),
    deleteConcept: vi.fn(),
  },
}))

vi.mock('../../ruleSystemStore', () => ({
  useRuleSystemStore: () => ({ ruleSystemCode: 'ESP' }),
}))

function wrap(ui: ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return render(ui, { wrapper: Wrapper })
}

function concepto(conceptCode: string, calculationType: string) {
  return {
    ruleSystemCode: 'ESP',
    conceptCode,
    conceptMnemonic: conceptCode,
    calculationType,
    functionalNature: 'DEDUCTION',
    executionScope: 'SEGMENT',
    payslipOrderCode: null,
    summary: null,
  }
}

/**
 * Un grafo pequeño pero **válido**: `700` es un PERCENTAGE con sus dos entradas conectadas.
 * Tiene que serlo, porque si `validateGraph` encuentra algo, el Guardar abre el modal de
 * validación y no llega a guardar — y entonces no se estaría probando nada de este issue.
 */
const CONCEPTOS = [
  concepto('B01', 'DIRECT_AMOUNT'),
  concepto('P_SS', 'ENGINE_PROVIDED'),
  concepto('700', 'PERCENTAGE'),
]

const OPERANDOS_DE_700 = [
  { operandRole: 'BASE', sourceObjectCode: 'B01' },
  { operandRole: 'PERCENTAGE', sourceObjectCode: 'P_SS' },
]

beforeEach(() => {
  vi.clearAllMocks()
  window.localStorage.clear()
})

describe('CanvasPage: la carga que falla', () => {
  it('lo dice, y dice que no es lo mismo que no tener conceptos', async () => {
    vi.mocked(conceptsApi.listConcepts).mockRejectedValue(new Error('500 Server Error'))

    wrap(<CanvasPage />)

    await screen.findByRole('alert')
    expect(screen.getByText('No se ha podido cargar el grafo.')).toBeInTheDocument()
    expect(screen.getByText(/no se sabe cuáles tiene/)).toBeInTheDocument()
    expect(screen.getByText('500 Server Error')).toBeInTheDocument()
  })

  it('ofrece reintentar, y reintentar vuelve a preguntar', async () => {
    vi.mocked(conceptsApi.listConcepts).mockRejectedValue(new Error('500 Server Error'))

    wrap(<CanvasPage />)
    await screen.findByRole('alert')
    expect(conceptsApi.listConcepts).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }))

    await waitFor(() => expect(conceptsApi.listConcepts).toHaveBeenCalledTimes(2))
  })
})

describe('CanvasPage: el guardado que falla', () => {
  beforeEach(() => {
    vi.mocked(conceptsApi.listConcepts).mockResolvedValue(CONCEPTOS)
    vi.mocked(conceptsApi.listOperands).mockImplementation(async (_rs, conceptCode) =>
      conceptCode === '700' ? OPERANDOS_DE_700 : [],
    )
    vi.mocked(conceptsApi.listFeeds).mockResolvedValue([])
  })

  it('deja de volver a «Guardar» como si nada, y nombra el concepto que no se guardó', async () => {
    vi.mocked(conceptsApi.replaceOperands).mockRejectedValue(new Error('409 Conflict'))

    wrap(<CanvasPage />)

    const guardar = await screen.findByRole('button', { name: /Guardar/ })
    fireEvent.click(guardar)

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('El grafo no se ha guardado entero.')
    expect(aviso).toHaveTextContent('700')
    expect(aviso).toHaveTextContent('409 Conflict')
  })

  it('un guardado que va bien no saca ningún aviso', async () => {
    vi.mocked(conceptsApi.replaceOperands).mockResolvedValue([])

    wrap(<CanvasPage />)

    const guardar = await screen.findByRole('button', { name: /Guardar/ })
    fireEvent.click(guardar)

    await waitFor(() => expect(conceptsApi.replaceOperands).toHaveBeenCalled())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
