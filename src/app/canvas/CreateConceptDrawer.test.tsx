import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import type { ReactElement, ReactNode } from 'react'
import { CreateConceptDrawer } from './CreateConceptDrawer'
import { conceptsApi } from './api/conceptsApi'

vi.mock('./api/conceptsApi', () => ({
  conceptsApi: { createConcept: vi.fn() },
}))

// El formulario no cambia ningun desplegable en estos tests: basta con que el
// Select pinte sus hijos para que el drawer renderice en jsdom.
vi.mock('@/components/ui/select', () => {
  const passthrough = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  return {
    Select: passthrough,
    SelectTrigger: passthrough,
    SelectValue: () => null,
    SelectContent: passthrough,
    SelectItem: passthrough,
  }
})

function wrap(ui: ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(conceptsApi.createConcept).mockResolvedValue({
    ruleSystemCode: 'ESP', conceptCode: '201', conceptMnemonic: 'PLUS_TRANSPORTE',
    calculationType: 'RATE_BY_QUANTITY', functionalNature: 'EARNING',
    executionScope: 'SEGMENT', payslipOrderCode: null, summary: null,
  })
})

describe('CreateConceptDrawer', () => {
  it('no ofrece composición ni persistencia del resultado: ya no gobiernan nada (ADR-058)', () => {
    wrap(<CreateConceptDrawer open onClose={() => {}} ruleSystemCode="ESP" />)
    expect(screen.getByText('Nuevo concepto')).toBeInTheDocument()
    expect(screen.queryByText(/composición/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/persistir resultado/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('crea el concepto con los campos que quedan, sin resultCompositionMode ni persistToConcepts', async () => {
    const onClose = vi.fn()
    wrap(<CreateConceptDrawer open onClose={onClose} ruleSystemCode="ESP" />)

    // El formulario no asocia Label e Input: los dos primeros textbox son Codigo y Mnemonico.
    const [codigo, mnemonico] = screen.getAllByRole('textbox')
    fireEvent.change(codigo, { target: { value: '201' } })
    fireEvent.change(mnemonico, { target: { value: 'PLUS_TRANSPORTE' } })
    fireEvent.click(screen.getByRole('button', { name: /crear concepto/i }))

    await waitFor(() => expect(conceptsApi.createConcept).toHaveBeenCalledTimes(1))
    const [ruleSystemCode, body] = vi.mocked(conceptsApi.createConcept).mock.calls[0]
    expect(ruleSystemCode).toBe('ESP')
    expect(body).toEqual({
      conceptCode: '201',
      conceptMnemonic: 'PLUS_TRANSPORTE',
      calculationType: 'RATE_BY_QUANTITY',
      functionalNature: 'EARNING',
      executionScope: 'SEGMENT',
      payslipOrderCode: null,
      summary: null,
    })
    expect(body).not.toHaveProperty('resultCompositionMode')
    expect(body).not.toHaveProperty('persistToConcepts')
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})
