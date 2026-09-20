import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { conceptsApi } from './api/conceptsApi'
import { useConceptGraph } from './useConceptsQuery'

vi.mock('./api/conceptsApi', () => ({
  conceptsApi: { getGraph: vi.fn(), listConcepts: vi.fn(), listOperands: vi.fn(), listFeeds: vi.fn() },
}))

/**
 * El grafo se dibuja con una petición, no con `1 + 2N` (`b4rrhh/designer#15`).
 *
 * ## Qué costaba antes
 *
 * `useConceptGraph` pedía la lista de conceptos y luego, **de uno en uno**, los operandos y las
 * alimentaciones de cada uno. Medido en el navegador con `performance.getEntriesByType`: **78**
 * peticiones con los 38 conceptos de `ESP` y **200** con un catálogo de 99, y 198 de esas 200
 * devolvían una lista de entre cero y dos elementos.
 *
 * Crece con los conceptos **del sistema de reglas**, no del recibo, así que lo paga igual el
 * recibo más simple. Y el grafo es lo que el backoffice embebe para explicar un número: la
 * pantalla que se abre justo después de que alguien pregunte «¿de dónde sale esto?».
 *
 * ## Qué vigila este test
 *
 * Las dos mitades, porque una sin la otra no vale:
 *
 * - **Una llamada**, con ocho conceptos igual que con uno. Si alguien vuelve a pedir por
 *   concepto, el contador lo dice el mismo día.
 * - **Y las mismas aristas**, con los mismos identificadores. Una petición que traiga menos
 *   grafo no es una mejora: es el dibujo incompleto, que sale igual de bonito.
 */
describe('useConceptGraph: una petición, y el grafo entero', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  function concepto(conceptCode: string) {
    return {
      ruleSystemCode: 'ESP',
      conceptCode,
      conceptMnemonic: conceptCode,
      calculationType: 'RATE_BY_QUANTITY',
      functionalNature: 'EARNING',
      executionScope: 'SEGMENT',
      payslipOrderCode: null,
      summary: null,
    }
  }

  function wrapper({ children }: { children: ReactNode }) {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  }

  it('pide el grafo una sola vez, tenga el sistema de reglas un concepto u ocho', async () => {
    const ocho = ['101', '102', '700', '703', '800', '970', '980', '990'].map(concepto)
    vi.mocked(conceptsApi.getGraph).mockResolvedValue({
      ruleSystemCode: 'ESP',
      concepts: ocho,
      operands: [],
      feeds: [],
    })

    const { result } = renderHook(() => useConceptGraph('ESP'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.nodes).toHaveLength(8)
    expect(conceptsApi.getGraph).toHaveBeenCalledTimes(1)
    // Y nadie pregunta por concepto: con ocho conceptos, esto eran 16 peticiones más.
    expect(conceptsApi.listOperands).not.toHaveBeenCalled()
    expect(conceptsApi.listFeeds).not.toHaveBeenCalled()
  })

  it('arma las aristas de operando y de alimentación con los identificadores de siempre', async () => {
    vi.mocked(conceptsApi.getGraph).mockResolvedValue({
      ruleSystemCode: 'ESP',
      concepts: [concepto('101'), concepto('B01'), concepto('970')],
      operands: [{ conceptCode: '970', operandRole: 'QUANTITY', sourceObjectCode: '101' }],
      feeds: [
        {
          conceptCode: 'B01',
          sourceObjectCode: '101',
          invertSign: true,
          effectiveFrom: '2025-01-01',
          effectiveTo: null,
        },
      ],
    })

    const { result } = renderHook(() => useConceptGraph('ESP'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const edges = result.current.data!.edges
    // Los identificadores no son decorativos: el salto al nodo y el resalte del recálculo los
    // usan, así que cambiarlos rompería dos gestos sin tocar ninguno de los dos.
    expect(edges.map(e => e.id)).toEqual(['op-101-970-QUANTITY', 'feed-101-B01'])

    expect(edges[0]).toMatchObject({ source: '101', target: '970', targetHandle: 'qty' })
    expect(edges[1]).toMatchObject({
      source: '101',
      target: 'B01',
      targetHandle: 'feed',
      data: { invertSign: true },
    })
  })
})
