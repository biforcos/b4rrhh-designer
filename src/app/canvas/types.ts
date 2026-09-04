import type { Node, Edge } from '@xyflow/react'

export type CalculationType = 'DIRECT_AMOUNT' | 'RATE_BY_QUANTITY' | 'PERCENTAGE' | 'AGGREGATE' | 'JAVA_PROVIDED' | 'ENGINE_PROVIDED' | 'EMPLOYEE_INPUT' | 'GREATEST' | 'LEAST'
export type FunctionalNature = 'EARNING' | 'DEDUCTION' | 'BASE' | 'INFORMATIONAL' | 'TECHNICAL' | 'TOTAL_EARNING' | 'TOTAL_DEDUCTION' | 'NET_PAY'
export type ResultCompositionMode = 'REPLACE' | 'ACCUMULATE'
export type ExecutionScope = 'SEGMENT' | 'PERIOD'

export interface ConceptNodeData extends Record<string, unknown> {
  conceptCode: string
  conceptMnemonic: string
  calculationType: CalculationType
  functionalNature: FunctionalNature
  resultCompositionMode: ResultCompositionMode
  executionScope: ExecutionScope
  payslipOrderCode: string | null
  persistToConcepts: boolean
  summary: string | null
  isDirty?: boolean
  onEditSummary?: (conceptCode: string) => void
  dimmed?: boolean
  neighborHighlight?: boolean
  ancestorHighlight?: boolean
}

export type ConceptFlowNode = Node<ConceptNodeData, 'concept'>

/** Estado de presentacion de una arista respecto al nodo seleccionado. */
export type EdgeFocus = 'path' | 'dimmed'
export type ConceptFlowEdge = Edge<{ operandRole?: string; invertSign?: boolean; focus?: EdgeFocus }>

export const INPUT_PORTS: Record<CalculationType, string[]> = {
  DIRECT_AMOUNT:    [],
  JAVA_PROVIDED:    [],
  ENGINE_PROVIDED:  [],
  EMPLOYEE_INPUT:   [],
  RATE_BY_QUANTITY: ['qty', 'rate'],
  PERCENTAGE:       ['base', 'pct'],
  AGGREGATE:        ['feed'],
  GREATEST:         ['left', 'right'],
  LEAST:            ['left', 'right'],
}
