import { useQuery } from '@tanstack/react-query'
import { conceptsApi } from './api/conceptsApi'
import { loadPositions } from './graphPositions'
import type { ConceptFlowNode, ConceptFlowEdge, CalculationType, FunctionalNature, ExecutionScope } from './types'

const GRID_COLS = 4
const NODE_WIDTH = 160
const NODE_HEIGHT = 120

// Backend OperandRole enum uses QUANTITY/PERCENTAGE; frontend handles use qty/pct
const ROLE_TO_HANDLE: Record<string, string> = {
  QUANTITY:   'qty',
  RATE:       'rate',
  BASE:       'base',
  PERCENTAGE: 'pct',
  LEFT:       'left',
  RIGHT:      'right',
  // tolerate values saved before this mapping was in place
  QTY:        'qty',
  PCT:        'pct',
}

/**
 * El grafo de conceptos de un sistema de reglas.
 *
 * `enabled` existe por el modo recibo: cuando la direccion de la URL no puede ser la de ningun
 * recibo no hay sistema de reglas que pedir, y preguntar por uno vacio seria una llamada que se
 * sabe fallida (`designer#8`).
 */
export function useConceptGraph(ruleSystemCode: string, enabled = true) {
  return useQuery({
    enabled,
    queryKey: ['concepts', ruleSystemCode],
    queryFn: async () => {
      // Una llamada y no `1 + 2N` (`designer#15`). Antes se pedia la lista de conceptos y luego,
      // de uno en uno, los operandos y las alimentaciones de cada uno: 78 peticiones con los 38
      // conceptos de ESP y 200 con un catalogo de 99, y 198 de esas 200 devolvian entre cero y
      // dos elementos.
      //
      // Cachear mas aqui no era el arreglo: react-query ya cachea por `queryKey`, y el problema
      // no era repetir la carga sino que la primera costara 200 viajes.
      const { concepts, operands, feeds } = await conceptsApi.getGraph(ruleSystemCode)

      const savedPositions = loadPositions(ruleSystemCode)
      const nodes: ConceptFlowNode[] = concepts.map((c, i) => ({
        id: c.conceptCode,
        type: 'concept' as const,
        position: savedPositions[c.conceptCode] ?? {
          x: (i % GRID_COLS) * (NODE_WIDTH + 40),
          y: Math.floor(i / GRID_COLS) * (NODE_HEIGHT + 40),
        },
        data: {
          conceptCode: c.conceptCode,
          conceptMnemonic: c.conceptMnemonic,
          calculationType: c.calculationType as CalculationType,
          functionalNature: c.functionalNature as FunctionalNature,
          executionScope: c.executionScope as ExecutionScope,
          payslipOrderCode: c.payslipOrderCode ?? null,
          summary: c.summary ?? null,
        },
      }))

      // Las aristas ya vienen planas y cada una sabe a que concepto apunta, asi que aqui no hay
      // que casarlas con nada por indice: los identificadores son los mismos de antes, que es lo
      // que hace que el salto al nodo y el resalte del recalculo sigan encontrandolas.
      const edges: ConceptFlowEdge[] = [
        ...operands.map(op => ({
          id: `op-${op.sourceObjectCode}-${op.conceptCode}-${op.operandRole}`,
          type: 'deletable' as const,
          source: op.sourceObjectCode,
          sourceHandle: 'out',
          target: op.conceptCode,
          targetHandle: ROLE_TO_HANDLE[op.operandRole] ?? op.operandRole.toLowerCase(),
          data: { operandRole: op.operandRole },
        })),
        ...feeds.map(feed => ({
          id: `feed-${feed.sourceObjectCode}-${feed.conceptCode}`,
          type: 'deletable' as const,
          source: feed.sourceObjectCode,
          sourceHandle: 'out',
          target: feed.conceptCode,
          targetHandle: 'feed',
          data: { invertSign: feed.invertSign },
        })),
      ]

      return { nodes, edges }
    },
  })
}
