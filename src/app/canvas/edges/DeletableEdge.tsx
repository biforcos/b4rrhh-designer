import { useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from '@xyflow/react'
import type { ConceptFlowEdge } from '../types'

// Cuatro trazos y ningun tono (designer#2). El color de la arista no dice que
// puerto alimenta —eso ya lo rotula el nodo de destino—, dice si esta en el
// camino del nodo seleccionado. El signo de un feed es un hecho distinto y se
// marca con trazo discontinuo, no con color.
const STROKE = {
  normal: { stroke: 'var(--ink-line)',        strokeWidth: 1.5 },
  path:   { stroke: 'var(--ink-line-active)', strokeWidth: 2 },
  dimmed: { stroke: 'var(--ink-line)',        strokeWidth: 1 },
}
const DASH_NEGATIVE_FEED = '4 3'
const DASH_DIMMED = '1 3'

export function DeletableEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  targetHandleId,
  style,
  markerEnd,
  selected,
  data,
}: EdgeProps<ConceptFlowEdge>) {
  const { setEdges } = useReactFlow()
  const [hovered, setHovered] = useState(false)
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })

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

  return (
    <>
      {/* Wide transparent hit area for hover detection */}
      <path
        d={edgePath}
        stroke="transparent"
        strokeWidth={12}
        fill="none"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        strokeDasharray={strokeDasharray}
        style={{ ...style, stroke, strokeWidth }}
      />
      <EdgeLabelRenderer>
        {selected && (
          <button
            type="button"
            title="Eliminar conexión"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan w-5 h-5 bg-error-bg border border-error-border text-error-text rounded-full text-sm leading-none flex items-center justify-center hover:border-error-text cursor-pointer"
            onClick={() => setEdges(eds => eds.filter(e => e.id !== id))}
          >
            ×
          </button>
        )}
        {hovered && targetHandleId && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 14}px)`,
              pointerEvents: 'none',
            }}
            className="bg-surface-panel border border-border-default text-text-secondary text-[8px] font-mono px-1.5 py-0.5 rounded-sm whitespace-nowrap shadow-(--shadow-card)"
          >
            → {targetHandleId}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}
