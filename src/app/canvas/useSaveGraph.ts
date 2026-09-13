import { useMutation, useQueryClient } from '@tanstack/react-query'
import { conceptsApi } from './api/conceptsApi'
import type { ConceptFlowNode, ConceptFlowEdge, CalculationType } from './types'
import { INPUT_PORTS } from './types'

// Map frontend handle names back to backend OperandRole enum values
const HANDLE_TO_ROLE: Record<string, string> = {
  qty:  'QUANTITY',
  rate: 'RATE',
  base: 'BASE',
  pct:  'PERCENTAGE',
}

export interface FailedConcept {
  conceptCode: string
  motivo: string
}

/**
 * El guardado no es atómico: es una llamada por nodo y no hay transacción detrás.
 *
 * Así que cuando falla, lo que hay no es «no se ha guardado» sino «se ha guardado una parte», y
 * decir sólo «ha fallado» obliga a adivinar cuál. Este error lleva las dos listas para que la
 * pantalla pueda decirlo (`designer#9`).
 */
export class GraphSaveError extends Error {
  // Campos declarados y asignados a mano: `erasableSyntaxOnly` no admite propiedades de
  // parametro, que es lo que aqui pedia el cuerpo.
  readonly fallidos: FailedConcept[]
  readonly guardados: string[]

  constructor(fallidos: FailedConcept[], guardados: string[]) {
    super(`No se han guardado ${fallidos.length} conceptos de ${fallidos.length + guardados.length}`)
    this.name = 'GraphSaveError'
    this.fallidos = fallidos
    this.guardados = guardados
  }
}

export function useSaveGraph(ruleSystemCode: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ nodes, edges }: { nodes: ConceptFlowNode[]; edges: ConceptFlowEdge[] }) => {
      // allSettled y no all: con `all`, en cuanto uno rechaza se descarta el resultado de los
      // demas — que ya se estaban escribiendo igual — y se pierde justo el dato que hace falta,
      // que es cuales pasaron.
      const resultados = await Promise.allSettled(nodes.map(async node => {
        const calcType = node.data.calculationType as CalculationType
        const requiredPorts = INPUT_PORTS[calcType]

        if (calcType === 'AGGREGATE') {
          const feeds = edges
            .filter(e => e.target === node.id && e.targetHandle === 'feed')
            .map(e => ({
              sourceObjectCode: e.source,
              invertSign: e.data?.invertSign ?? false,
              effectiveFrom: '2020-01-01',
              effectiveTo: null,
            }))
          await conceptsApi.replaceFeeds(ruleSystemCode, node.id, feeds)
        } else if (requiredPorts.length > 0) {
          const operands = edges
            .filter(e => e.target === node.id)
            .map(e => {
              const handle = e.targetHandle ?? ''
              return {
                operandRole: HANDLE_TO_ROLE[handle] ?? handle.toUpperCase(),
                sourceObjectCode: e.source,
              }
            })
            .filter(o => o.operandRole)
          await conceptsApi.replaceOperands(ruleSystemCode, node.id, operands)
        }
      }))

      const fallidos: FailedConcept[] = []
      const guardados: string[] = []
      resultados.forEach((r, i) => {
        if (r.status === 'rejected') {
          fallidos.push({
            conceptCode: nodes[i].id,
            motivo: r.reason instanceof Error ? r.reason.message : String(r.reason),
          })
        } else {
          guardados.push(nodes[i].id)
        }
      })

      if (fallidos.length > 0) {
        throw new GraphSaveError(fallidos, guardados)
      }
    },
    // Se refresca tanto si fue bien como si no: cuando falla a medias, lo que hay en pantalla ya
    // no es lo que hay en la base, y dejarlo sin recargar seria seguir mintiendo en otro sitio.
    onSettled: () => qc.invalidateQueries({ queryKey: ['concepts', ruleSystemCode] }),
  })
}
