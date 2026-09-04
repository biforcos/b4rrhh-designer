import type { CalculationType, FunctionalNature, ResultCompositionMode, ExecutionScope } from './types'

export const NATURE_LABELS: Record<FunctionalNature, string> = {
  EARNING:          'Devengo',
  DEDUCTION:        'Deducción',
  BASE:             'Base',
  INFORMATIONAL:    'Informativo',
  TECHNICAL:        'Técnico',
  TOTAL_EARNING:    'Total devengos',
  TOTAL_DEDUCTION:  'Total deducciones',
  NET_PAY:          'Líquido',
}

/*
 * El color del nodo codifica la naturaleza funcional y solo eso (designer#2):
 * una franja de 3px en el borde izquierdo de la tarjeta. Ocho naturalezas en
 * cuatro marcas y cero colores nuevos: lo que distingue un concepto de su
 * total no es un tono mas, es el peso (el fondo, el borde, los puntos).
 *
 * Son clases de Tailwind sobre los tokens del sistema; se aplican a la
 * tarjeta del nodo y a la muestra de la leyenda y del filtro.
 */
export const NATURE_COLORS: Record<FunctionalNature, string> = {
  EARNING:          'border-l-success-text',
  TOTAL_EARNING:    'border-l-success-text bg-success-bg',
  DEDUCTION:        'border-l-error-text',
  TOTAL_DEDUCTION:  'border-l-error-text bg-error-bg',
  BASE:             'border-l-accent-primary',
  NET_PAY:          'border-l-accent-primary border-accent-primary border-[1.5px] border-l-[3px]',
  TECHNICAL:        'border-l-border-strong',
  INFORMATIONAL:    'border-l-text-tertiary [border-left-style:dotted]',
}

export const CALCULATION_TYPE_LABELS: Record<CalculationType, string> = {
  DIRECT_AMOUNT:    'DIRECT AMOUNT',
  JAVA_PROVIDED:    'ENGINE PROVIDED',
  ENGINE_PROVIDED:  'ENGINE PROVIDED',
  EMPLOYEE_INPUT:   'EMPLOYEE INPUT',
  RATE_BY_QUANTITY: 'RATE×QTY',
  PERCENTAGE:       'PERCENTAGE',
  AGGREGATE:        'AGGREGATE',
  GREATEST:         'GREATEST',
  LEAST:            'LEAST',
}

export const COMPOSITION_LABELS: Record<ResultCompositionMode, string> = {
  REPLACE:    'Reemplaza',
  ACCUMULATE: 'Acumula',
}

export const SCOPE_LABELS: Record<ExecutionScope, string> = {
  SEGMENT: 'Segmento',
  PERIOD:  'Período',
}
