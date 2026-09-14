import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react'
import type { ConceptFlowEdge } from '../types'
import { edgeStroke } from './edgeStroke'

/**
 * La arista del modo recibo: el mismo trazo que la del lienzo de edición y **sin el botón de
 * borrar**.
 *
 * No es la `DeletableEdge` con el botón apagado: es otra arista, y por el mismo motivo por el que
 * el modo de alta del `designer#10` se quitó en vez de deshabilitarse. Un aspa gris invita a
 * preguntar por qué; una que no está no engaña a nadie.
 */
export function FlowEdge({
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps<ConceptFlowEdge>) {
  const [edgePath] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  })
  const { stroke, strokeWidth, strokeDasharray } = edgeStroke(data)

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      strokeDasharray={strokeDasharray}
      style={{ ...style, stroke, strokeWidth }}
    />
  )
}
