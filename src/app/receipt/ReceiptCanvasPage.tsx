import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import type { ReactFlowInstance } from '@xyflow/react'
import { ConceptGraphCanvas } from '../canvas/ConceptGraphCanvas'
import { useConceptGraph } from '../canvas/useConceptsQuery'
import { useGraphFocusDisplay } from '../canvas/useGraphFocusDisplay'
import { loadPositionsOrLayout } from '../canvas/graphPositions'
import type { ConceptFlowEdge, ConceptFlowNode } from '../canvas/types'
import { ApiError } from '../../api/client'
import { readPayrollAddress } from './payrollAddress'
import { usePayrollStepsQuery } from './usePayrollStepsQuery'
import { buildReceiptValues, receiptValueOf } from './receiptValues'
import { ReceiptConceptPanel } from './ReceiptConceptPanel'
import { useEmbeddedFocus } from './useEmbeddedFocus'
import { postNodeClicked } from './embedBridge'

/**
 * El lienzo del designer abierto **para un recibo concreto**: los mismos nodos y las mismas
 * aristas, con los valores de ese recibo encima y sin ninguna manera de escribir (`designer#8`).
 *
 * Es una página aparte del `CanvasPage` y no el mismo con un modo, y eso es la mitad del issue: la
 * barra de `+ Concepto` y `Guardar`, el cajón de alta y el panel que edita viven allí y **aquí no se
 * renderizan porque no están en este componente**. Un botón apagado invita a preguntar por qué; uno
 * que no existe no engaña a nadie. Lo que sí se comparte es el dibujo —`ConceptGraphCanvas` y
 * `useGraphFocusDisplay`—, porque dos dibujos del mismo grafo divergen y entonces la explicación de
 * un número deja de parecerse al grafo que lo produce (`frontend#42`).
 *
 * El sistema de reglas sale de la URL y **no se escribe** en el `ruleSystemStore`: ése es el del
 * lienzo de edición, y cambiárselo por abrir un recibo sería moverle la mesa a quien está al lado.
 * Las posiciones de los nodos sí se leen de ahí, para que el dibujo sea el mismo; no se guardan.
 */
export function ReceiptCanvasPage() {
  const params = useParams()
  const address = useMemo(() => readPayrollAddress(params), [params])

  const graph = useConceptGraph(address?.ruleSystemCode ?? '', address !== null)
  const steps = usePayrollStepsQuery(address)

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [rfInstance, setRfInstance] =
    useState<ReactFlowInstance<ConceptFlowNode, ConceptFlowEdge> | null>(null)

  // Aquí los nodos son un cálculo, no un estado: nadie los arrastra ni los conecta, así que no hay
  // nada que guardar entre renders. Las posiciones se leen de donde las dejó el lienzo de edición
  // —para que el dibujo sea el mismo— y no se escriben: arrastrar aquí le movería la mesa al de al
  // lado.
  const nodes = useMemo(
    () =>
      graph.data && address
        ? loadPositionsOrLayout(address.ruleSystemCode, graph.data.nodes, graph.data.edges)
        : [],
    [graph.data, address],
  )

  // La arista del modo recibo no lleva el aspa de borrar: es otra arista, no la de edición apagada.
  const edges = useMemo<ConceptFlowEdge[]>(
    () => (graph.data?.edges ?? []).map((e) => ({ ...e, type: 'flow' })),
    [graph.data],
  )

  const receiptValues = useMemo(() => buildReceiptValues(steps.data ?? []), [steps.data])

  const valuedNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: { ...n.data, receipt: receiptValueOf(receiptValues, n.data.conceptCode) },
      })),
    [nodes, receiptValues],
  )

  const { displayNodes, displayEdges } = useGraphFocusDisplay(valuedNodes, edges, selectedNodeId)

  const hasSteps = (steps.data?.length ?? 0) > 0
  const graphIsOnScreen = graph.isSuccess && steps.isSuccess && hasSteps && nodes.length > 0

  const focusConcept = useCallback(
    (conceptCode: string) => {
      setSelectedNodeId(conceptCode)
      const node = nodes.find((n) => n.id === conceptCode)
      if (node && rfInstance) {
        rfInstance.setCenter(node.position.x + 80, node.position.y + 40, {
          zoom: 1.5,
          duration: 500,
        })
      }
    },
    [nodes, rfInstance],
  )

  useEmbeddedFocus({ graphLoaded: graphIsOnScreen, onFocus: focusConcept })

  const handleNodeClick = useCallback((node: ConceptFlowNode) => {
    setSelectedNodeId(node.id)
    postNodeClicked(node.data.conceptCode, window.parent, window, window.location.origin)
  }, [])

  if (address === null) {
    return (
      <Notice
        title="Esta dirección no es la de ningún recibo."
        body="El tipo de nómina tiene que ser NORMAL o EXTRA, y el número de presencia un entero positivo."
      />
    )
  }

  if (graph.isLoading || steps.isLoading) {
    return (
      <ReceiptFrame>
        <div className="flex h-full flex-1 items-center justify-center text-text-tertiary">
          Cargando el recibo...
        </div>
      </ReceiptFrame>
    )
  }

  // Los cuatro silencios de esta pantalla, cada uno con su motivo. Un lienzo en blanco los diría
  // todos a la vez, y ése es el defecto que este issue viene a quitar.
  if (graph.isError) {
    return (
      <Notice
        title="No se ha podido cargar el grafo."
        body={`Esto no quiere decir que ${address.ruleSystemCode} no tenga conceptos: quiere decir que no se sabe cuáles tiene.`}
        detail={graph.error instanceof Error ? graph.error.message : undefined}
      />
    )
  }

  if (steps.isError && steps.error instanceof ApiError && steps.error.status === 404) {
    return (
      <Notice
        title="No hay ningún recibo en esta dirección."
        body={`${address.employeeNumber} · ${address.payrollPeriodCode} · ${address.payrollTypeCode} · presencia ${address.presenceNumber}. La presencia es la parte que se suele errar: un empleado readmitido tiene su recibo en la presencia 2, no en la 1.`}
      />
    )
  }

  if (steps.isError) {
    return (
      <Notice
        title="No se han podido cargar los pasos del cálculo."
        body="El recibo puede existir: lo que no se sabe es cómo se calculó."
        detail={steps.error instanceof Error ? steps.error.message : undefined}
      />
    )
  }

  if (!hasSteps) {
    return (
      <Notice
        title="Este recibo no tiene pasos guardados."
        body="Se calculó antes de que el motor guardara sus pasos. Recalcúlalo para verlos."
        detail={undefined}
        note="No se pinta el grafo en gris a propósito: un nodo por concepto diciendo «no participó» sería falso. No es que no participaran, es que de este recibo no se sabe."
      />
    )
  }

  const selectedNode = displayNodes.find((n) => n.id === selectedNodeId) ?? null

  return (
    <ReceiptFrame>
      <div data-testid="receipt-canvas" className="relative flex-1">
        <ConceptGraphCanvas
          nodes={displayNodes}
          edges={displayEdges}
          onNodeClick={handleNodeClick}
          onPaneClick={() => setSelectedNodeId(null)}
          onInit={setRfInstance}
          showMiniMap={!selectedNode}
          editable={false}
        />
      </div>

      {selectedNode && (
        <ReceiptConceptPanel
          node={selectedNode}
          value={receiptValueOf(receiptValues, selectedNode.data.conceptCode)}
        />
      )}
    </ReceiptFrame>
  )
}

/**
 * El marco de la pantalla del recibo, y la altura.
 *
 * Esta página cuelga **fuera** del `AppShell`, que era quien ponía `h-screen` y el fondo de la
 * aplicación. Sin eso, el `h-full` del lienzo se apoya en un `#root` de altura cero, React Flow se
 * mide 0×0 y el `fitView` encuadra sobre la nada: la página sale en blanco con todos los nodos
 * fuera de la vista y sin ningún error. Se vio en el navegador, no en los tests —jsdom no
 * maqueta—, así que lo que queda en el test es el candado de la clase.
 */
function ReceiptFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-app text-text-primary">{children}</div>
  )
}

function Notice({
  title,
  body,
  detail,
  note,
}: {
  title: string
  body: string
  detail?: string
  note?: string
}) {
  return (
    <ReceiptFrame>
      <div
        role="alert"
        className="flex h-full flex-1 flex-col items-center justify-center gap-3 px-6 text-center"
      >
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="max-w-md text-xs text-text-tertiary">{body}</p>
        {note && <p className="max-w-md text-[11px] text-text-tertiary">{note}</p>}
        {detail && <p className="font-mono text-xs text-text-tertiary">{detail}</p>}
      </div>
    </ReceiptFrame>
  )
}
