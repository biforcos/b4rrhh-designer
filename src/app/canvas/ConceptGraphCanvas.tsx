import type { ReactNode } from 'react'
import { ReactFlow, MiniMap, Controls, Panel } from '@xyflow/react'
import type { ReactFlowInstance, Connection, OnNodesChange, OnEdgesChange } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ConceptNode } from './nodes/ConceptNode'
import { DeletableEdge } from './edges/DeletableEdge'
import { FlowEdge } from './edges/FlowEdge'
import { CanvasGrid } from './CanvasGrid'
import { CanvasLegend } from './CanvasLegend'
import type { ConceptFlowEdge, ConceptFlowNode } from './types'

const nodeTypes = { concept: ConceptNode }
const edgeTypes = { deletable: DeletableEdge, flow: FlowEdge }

interface Props {
  nodes: ConceptFlowNode[]
  edges: ConceptFlowEdge[]
  onNodeClick: (node: ConceptFlowNode) => void
  onPaneClick: () => void
  onInit: (instance: ReactFlowInstance<ConceptFlowNode, ConceptFlowEdge>) => void
  /** Retícula y minimapa aparte, el lienzo de edición añade su barra de herramientas aquí. */
  children?: ReactNode
  showMiniMap?: boolean
  /** Lo que sólo tiene sentido editando: mover, conectar y cambiar. En modo recibo, nada de esto. */
  editable?: boolean
  onNodesChange?: OnNodesChange<ConceptFlowNode>
  onEdgesChange?: OnEdgesChange<ConceptFlowEdge>
  onConnect?: (params: Connection) => void
  onNodeDragStop?: () => void
}

/**
 * El dibujo del grafo, y **el único** que hay.
 *
 * Lo comparten el lienzo de edición y el modo recibo porque dos dibujos del mismo grafo divergen,
 * y aquí divergir significa que la explicación de un número deja de parecerse al grafo que lo
 * produce (`frontend#42`, `designer#8`).
 *
 * Lo que cambia entre los dos no es el dibujo: es lo que se puede hacer con él. `editable` en falso
 * quita arrastrar, conectar y seleccionar aristas; los botones de escribir no están apagados, es
 * que la página del recibo no los pinta.
 */
export function ConceptGraphCanvas({
  nodes,
  edges,
  onNodeClick,
  onPaneClick,
  onInit,
  children,
  showMiniMap = true,
  editable = true,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeDragStop,
}: Props) {
  return (
    <ReactFlow<ConceptFlowNode, ConceptFlowEdge>
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={(_, node) => { if (node.type === 'concept') onNodeClick(node as ConceptFlowNode) }}
      onNodeDragStop={onNodeDragStop}
      onPaneClick={onPaneClick}
      onInit={onInit}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesDraggable={editable}
      nodesConnectable={editable}
      edgesFocusable={editable}
      fitView
    >
      <CanvasGrid />
      {children}
      {/* Con el panel de detalle abierto se mira un nodo, no se navega: el minimapa sobra, y
          ademas el panel se le comia el borde. */}
      {showMiniMap && <MiniMap />}
      <Controls />
      <Panel position="bottom-right">
        <CanvasLegend />
      </Panel>
    </ReactFlow>
  )
}
