import { apiFetch } from '../../../api/client'

export interface ConceptDto {
  ruleSystemCode: string
  conceptCode: string
  conceptMnemonic: string
  calculationType: string
  functionalNature: string
  executionScope: string
  payslipOrderCode: string | null
  summary: string | null
}

export interface OperandDto { operandRole: string; sourceObjectCode: string }
export interface FeedDto { sourceObjectCode: string; invertSign: boolean; effectiveFrom: string; effectiveTo: string | null }

/**
 * Las aristas del grafo entero llevan el concepto al que apuntan, que es lo que las de un
 * concepto suelto no necesitan: alli el destino esta en la ruta.
 */
export interface GraphOperandDto extends OperandDto { conceptCode: string }
export interface GraphFeedDto extends FeedDto { conceptCode: string }

export interface ConceptGraphDto {
  ruleSystemCode: string
  concepts: ConceptDto[]
  operands: GraphOperandDto[]
  feeds: GraphFeedDto[]
}

export const conceptsApi = {
  /**
   * El grafo entero en una llamada (`b4rrhh/designer#15`).
   *
   * Sustituye a `listConcepts` + `listOperands`/`listFeeds` por concepto, que eran `1 + 2N`
   * peticiones: 78 con los 38 conceptos de ESP y 200 con un catalogo de 99, de las cuales 198
   * devolvian una lista de entre cero y dos elementos.
   *
   * Los tres de abajo se quedan y no sobran: `listConcepts` lo usa quien solo necesita la lista,
   * y los dos por concepto son contra lo que trabajan el panel de detalle y los dos PUT.
   */
  getGraph: (ruleSystemCode: string) =>
    apiFetch<ConceptGraphDto>(`/payroll-engine/${ruleSystemCode}/graph`),

  listConcepts: (ruleSystemCode: string) =>
    apiFetch<ConceptDto[]>(`/payroll-engine/${ruleSystemCode}/concepts`),

  listOperands: (ruleSystemCode: string, conceptCode: string) =>
    apiFetch<OperandDto[]>(`/payroll-engine/${ruleSystemCode}/concepts/${conceptCode}/operands`),

  listFeeds: (ruleSystemCode: string, conceptCode: string) =>
    apiFetch<FeedDto[]>(`/payroll-engine/${ruleSystemCode}/concepts/${conceptCode}/feeds`),

  createConcept: (ruleSystemCode: string, body: Omit<ConceptDto, 'ruleSystemCode'>) =>
    apiFetch<ConceptDto>(`/payroll-engine/${ruleSystemCode}/concepts`, {
      method: 'POST', body: JSON.stringify(body),
    }),

  updateSummary: (ruleSystemCode: string, conceptCode: string, summary: string | null) =>
    apiFetch<ConceptDto>(`/payroll-engine/${ruleSystemCode}/concepts/${conceptCode}/summary`, {
      method: 'PATCH', body: JSON.stringify({ summary }),
    }),

  deleteConcept: (ruleSystemCode: string, conceptCode: string) =>
    apiFetch<void>(`/payroll-engine/${ruleSystemCode}/concepts/${conceptCode}`, { method: 'DELETE' }),

  replaceOperands: (ruleSystemCode: string, conceptCode: string, operands: OperandDto[]) =>
    apiFetch<OperandDto[]>(`/payroll-engine/${ruleSystemCode}/concepts/${conceptCode}/operands`, {
      method: 'PUT', body: JSON.stringify({ operands }),
    }),

  replaceFeeds: (ruleSystemCode: string, conceptCode: string, feeds: FeedDto[]) =>
    apiFetch<void>(`/payroll-engine/${ruleSystemCode}/concepts/${conceptCode}/feeds`, {
      method: 'PUT', body: JSON.stringify({ feeds }),
    }),
}
