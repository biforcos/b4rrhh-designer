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

/**
 * Hasta dónde puede alejarse el lienzo, y por qué no vale el 0,5 de React Flow (`designer#14`).
 *
 * `fitView` no ajusta más allá de `minZoom`, así que con el suelo por omisión el nombre promete
 * algo que no hace: se entra al 0,5 y lo que no quepa se busca arrastrando. Medido en el
 * `b4rrhh/workspace#10`, el marco del modo recibo —759 × 898 px en una ventana de 1.600 × 1.000—
 * enseña 1.518 × 1.796 unidades de dibujo, y **el grafo del catálogo ESP de hoy, con 38 conceptos,
 * mide 2.300 × 1.715**: se entra viendo el 69 %, y no hay forma de ver el resto entero.
 *
 * El 0,05 sale de lo que se midió al crecer, no de un número redondo: dos catálogos sintéticos de
 * ~100 conceptos piden 0,17 y 0,096 para verse enteros. Con el suelo aquí, los dos caben y queda
 * sitio.
 *
 * **Esto arregla «no se puede ver entero», no «a ese tamaño se lee».** A 0,096 un nodo mide 15 px
 * de alto y es un punto, no un nodo. Son dos problemas distintos y éste es el barato; el otro
 * —nodo simplificado por debajo de cierto zoom, por ejemplo— es otro issue si alguien decide que
 * hace falta, y el mismo `workspace#10` midió que los dos gestos de navegación aguantan los cien
 * conceptos, así que el grafo entero puede ser ilegible sin que se pierda la explicación.
 */
const MIN_ZOOM = 0.05

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
      minZoom={MIN_ZOOM}
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
