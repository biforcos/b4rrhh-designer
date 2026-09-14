import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useGraphFocusDisplay } from './useGraphFocusDisplay'
import type { ConceptFlowEdge, ConceptFlowNode } from './types'

function node(id: string): ConceptFlowNode {
  return {
    id,
    type: 'concept',
    position: { x: 0, y: 0 },
    data: {
      conceptCode: id,
      conceptMnemonic: id,
      calculationType: 'DIRECT_AMOUNT',
      functionalNature: 'BASE',
      executionScope: 'PERIOD',
      payslipOrderCode: null,
      summary: null,
    },
  }
}

function edge(source: string, target: string): ConceptFlowEdge {
  return { id: `e-${source}-${target}`, source, target }
}

// A → B → C: al seleccionar C, A y B son sus operandos aguas arriba y D no tiene nada que ver.
const NODES = [node('A'), node('B'), node('C'), node('D')]
const EDGES = [edge('A', 'B'), edge('B', 'C')]

describe('useGraphFocusDisplay', () => {
  it('sin nada seleccionado no atenúa ni marca nada', () => {
    const { result } = renderHook(() => useGraphFocusDisplay(NODES, EDGES, null))

    for (const n of result.current.displayNodes) {
      expect(n.data.dimmed).toBe(false)
      expect(n.data.neighborHighlight).toBe(false)
      expect(n.data.ancestorHighlight).toBe(false)
    }
  })

  it('sin nada seleccionado las aristas van tal cual', () => {
    const { result } = renderHook(() => useGraphFocusDisplay(NODES, EDGES, null))

    expect(result.current.displayEdges).toBe(EDGES)
  })

  it('al seleccionar C enciende sus operandos aguas arriba hasta la hoja', () => {
    const { result } = renderHook(() => useGraphFocusDisplay(NODES, EDGES, 'C'))
    const byId = new Map(result.current.displayNodes.map((n) => [n.id, n.data]))

    expect(byId.get('B')!.neighborHighlight).toBe(true)
    expect(byId.get('A')!.ancestorHighlight).toBe(true)
    expect(byId.get('A')!.dimmed).toBe(false)
  })

  it('al seleccionar C atenúa lo que no está en el camino', () => {
    const { result } = renderHook(() => useGraphFocusDisplay(NODES, EDGES, 'C'))
    const byId = new Map(result.current.displayNodes.map((n) => [n.id, n.data]))

    expect(byId.get('D')!.dimmed).toBe(true)
  })

  it('un vecino no se marca además como ancestro: cada nodo lleva un grado, no dos', () => {
    const { result } = renderHook(() => useGraphFocusDisplay(NODES, EDGES, 'C'))
    const byId = new Map(result.current.displayNodes.map((n) => [n.id, n.data]))

    expect(byId.get('B')!.ancestorHighlight).toBe(false)
  })

  it('las aristas del camino van marcadas y las de fuera atenuadas', () => {
    const { result } = renderHook(() => useGraphFocusDisplay([...NODES, node('E')], [...EDGES, edge('D', 'E')], 'C'))
    const byId = new Map(result.current.displayEdges.map((e) => [e.id, e.data?.focus]))

    expect(byId.get('e-A-B')).toBe('path')
    expect(byId.get('e-B-C')).toBe('path')
    expect(byId.get('e-D-E')).toBe('dimmed')
  })
})
