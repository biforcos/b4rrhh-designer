import { useState } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from '@xyflow/react'
import type { ConceptFlowEdge } from '../types'
import { edgeStroke } from './edgeStroke'

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

  const { stroke, strokeWidth, strokeDasharray } = edgeStroke(data, { selected, hovered })

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
