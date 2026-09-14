import type { ConceptFlowEdge } from '../types'

// Cuatro trazos y ningun tono (designer#2). El color de la arista no dice que puerto alimenta
// —eso ya lo rotula el nodo de destino—, dice si esta en el camino del nodo seleccionado. El signo
// de un feed es un hecho distinto y se marca con trazo discontinuo, no con color.
const STROKE = {
  normal: { stroke: 'var(--ink-line)', strokeWidth: 1.5 },
  path: { stroke: 'var(--ink-line-active)', strokeWidth: 2 },
  dimmed: { stroke: 'var(--ink-line)', strokeWidth: 1 },
}
const DASH_NEGATIVE_FEED = '4 3'
const DASH_DIMMED = '1 3'

export interface EdgeStrokeState {
  selected?: boolean
  hovered?: boolean
}

/** El trazo de una arista a partir de su foco y su signo. Compartido por las dos aristas. */
export function edgeStroke(
  data: ConceptFlowEdge['data'],
  { selected = false, hovered = false }: EdgeStrokeState = {},
) {
  const focus = data?.focus
  const base = focus === 'path' ? STROKE.path : focus === 'dimmed' ? STROKE.dimmed : STROKE.normal
  const stroke = selected
    ? 'var(--text-inverse)'
    : hovered && focus !== 'path'
      ? 'var(--ink-line-strong)'
      : base.stroke
  const strokeWidth = selected || hovered ? 2 : base.strokeWidth
  const strokeDasharray = focus === 'dimmed'
    ? DASH_DIMMED
    : data?.invertSign
      ? DASH_NEGATIVE_FEED
      : undefined

  return { stroke, strokeWidth, strokeDasharray }
}
