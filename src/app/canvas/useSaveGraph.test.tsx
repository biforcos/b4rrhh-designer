import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { useSaveGraph, GraphSaveError } from './useSaveGraph'
import { conceptsApi } from './api/conceptsApi'
import type { ConceptFlowNode, ConceptFlowEdge } from './types'

vi.mock('./api/conceptsApi', () => ({
  conceptsApi: { replaceOperands: vi.fn(), replaceFeeds: vi.fn() },
}))

function nodo(conceptCode: string): ConceptFlowNode {
  return {
    id: conceptCode,
    type: 'concept',
    position: { x: 0, y: 0 },
    data: {
      conceptCode,
      conceptMnemonic: conceptCode,
      calculationType: 'PERCENTAGE',
      functionalNature: 'DEDUCTION',
      executionScope: 'SEGMENT',
      payslipOrderCode: null,
      summary: null,
    },
  }
}

const ARISTAS: ConceptFlowEdge[] = []

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useSaveGraph', () => {
  it('no falla cuando los tres conceptos se guardan', async () => {
    vi.mocked(conceptsApi.replaceOperands).mockResolvedValue([])

    const { result } = renderHook(() => useSaveGraph('ESP'), { wrapper })
    result.current.mutate({ nodes: [nodo('700'), nodo('701'), nodo('800')], edges: ARISTAS })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.isError).toBe(false)
  })

  /**
   * Lo que este issue vino a cerrar: el guardado es una llamada por nodo y sin transaccion, asi
   * que cuando uno falla los demas ya se han escrito. Decir «ha fallado» a secas obliga a
   * adivinar cual (`designer#9`).
   */
  it('cuando uno falla, dice cual fallo y cuales si se guardaron', async () => {
    vi.mocked(conceptsApi.replaceOperands).mockImplementation(async (_rs, conceptCode) => {
      if (conceptCode === '701') throw new Error('409 Conflict')
      return []
    })

    const { result } = renderHook(() => useSaveGraph('ESP'), { wrapper })
    result.current.mutate({ nodes: [nodo('700'), nodo('701'), nodo('800')], edges: ARISTAS })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const error = result.current.error
    expect(error).toBeInstanceOf(GraphSaveError)
    const fallo = error as GraphSaveError
    expect(fallo.fallidos).toEqual([{ conceptCode: '701', motivo: '409 Conflict' }])
    expect(fallo.guardados).toEqual(['700', '800'])
  })

  it('cuando fallan todos lo dice sin lista de guardados', async () => {
    vi.mocked(conceptsApi.replaceOperands).mockRejectedValue(new Error('500 Server Error'))

    const { result } = renderHook(() => useSaveGraph('ESP'), { wrapper })
    result.current.mutate({ nodes: [nodo('700'), nodo('701')], edges: ARISTAS })

    await waitFor(() => expect(result.current.isError).toBe(true))

    const fallo = result.current.error as GraphSaveError
    expect(fallo.guardados).toEqual([])
    expect(fallo.fallidos.map(f => f.conceptCode)).toEqual(['700', '701'])
  })

  /**
   * Los demas nodos se escriben igual —sus promesas ya estaban en marcha—, asi que el fallo no
   * puede usarse como excusa para no llamarlos: el test fija que se intentan los tres.
   */
  it('intenta todos los nodos aunque el primero falle', async () => {
    vi.mocked(conceptsApi.replaceOperands).mockImplementation(async (_rs, conceptCode) => {
      if (conceptCode === '700') throw new Error('boom')
      return []
    })

    const { result } = renderHook(() => useSaveGraph('ESP'), { wrapper })
    result.current.mutate({ nodes: [nodo('700'), nodo('701'), nodo('800')], edges: ARISTAS })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(conceptsApi.replaceOperands).toHaveBeenCalledTimes(3)
  })
})
