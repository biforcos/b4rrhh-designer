import { useMemo } from 'react'
import { useGraphFocus } from './useGraphFocus'
import type { ConceptFlowEdge, ConceptFlowNode, EdgeFocus } from './types'

/**
 * El atenuado y las marcas del nodo seleccionado, que son **los mismos en los dos lienzos**.
 *
 * El de edición y el de recibo comparten esto a propósito: si cada uno pintara su foco, el día que
 * uno cambiara la explicación de un número dejaría de parecerse al grafo que lo produce, que es la
 * razón entera de embeber en vez de redibujar (`frontend#42`, `designer#8`).
 *
 * Con un nodo seleccionado, cada arista está en su camino o fuera de él, y el trazo lo decide la
 * arista a partir de ese hecho, no de un color.
 */
export function useGraphFocusDisplay(
  nodes: ConceptFlowNode[],
  edges: ConceptFlowEdge[],
  selectedNodeId: string | null,
): { displayNodes: ConceptFlowNode[]; displayEdges: ConceptFlowEdge[] } {
  const { focusedNodeIds, neighborNodeIds, ancestorNodeIds, focusedEdgeIds, ancestorEdgeIds } =
    useGraphFocus(selectedNodeId, edges)

  const displayNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          dimmed: selectedNodeId != null && !focusedNodeIds.has(n.id),
          neighborHighlight: selectedNodeId != null && neighborNodeIds.has(n.id),
          ancestorHighlight:
            selectedNodeId != null && ancestorNodeIds.has(n.id) && !neighborNodeIds.has(n.id),
        },
      })),
    [nodes, selectedNodeId, focusedNodeIds, neighborNodeIds, ancestorNodeIds],
  )

  const displayEdges = useMemo(() => {
    if (selectedNodeId == null) return edges
    return edges.map((e) => {
      const focus: EdgeFocus =
        focusedEdgeIds.has(e.id) || ancestorEdgeIds.has(e.id) ? 'path' : 'dimmed'
      return { ...e, data: { ...e.data, focus } }
    })
  }, [edges, selectedNodeId, focusedEdgeIds, ancestorEdgeIds])

  return { displayNodes, displayEdges }
}
