import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '@/lib/utils'
import { type ConceptFlowNode, INPUT_PORTS } from '../types'
import { NATURE_LABELS, NATURE_COLORS, CALCULATION_TYPE_LABELS } from '../conceptLabels'

// Sobre tinta la seleccion se marca en blanco, no en azul: el acento del
// sistema es justo el color del fondo. El grado dice la distancia al nodo
// seleccionado: pleno el propio y sus vecinos, medio el resto del camino.
const FOCUS_RING = {
  selected: 'outline-2 outline-offset-2 outline-text-inverse',
  neighbor: 'outline-1 outline-offset-2 outline-text-inverse',
  ancestor: 'outline-1 outline-offset-2 outline-ink-line-strong',
}

export function ConceptNode({ data, selected }: NodeProps<ConceptFlowNode>) {
  const inputPorts = INPUT_PORTS[data.calculationType] ?? []

  const focusClass = data.dimmed
    ? ''
    : selected
    ? FOCUS_RING.selected
    : data.neighborHighlight
    ? FOCUS_RING.neighbor
    : data.ancestorHighlight
    ? FOCUS_RING.ancestor
    : ''

  return (
    <div className={cn(
      'min-w-[140px] rounded-md border border-border-strong border-l-[3px] bg-surface-panel text-xs text-text-primary shadow-(--shadow-card) transition-opacity duration-200',
      NATURE_COLORS[data.functionalNature],
      data.dimmed ? 'opacity-[0.12] pointer-events-none' : 'opacity-100',
      focusClass,
      data.isDirty && 'border-dashed',
    )}>
      {/*
        La linea de identidad del nodo es el CODIGO del concepto (701, D02,
        B01): la business key con la que se le nombra en operandos, feeds,
        rutas de la API y seeds. El mnemonico (FP_TRABAJADOR) va debajo y en
        pequeno porque describe, no identifica: es largo, no se lee a zoom
        0,5 y dos conceptos pueden parecerse por el nombre.

        No es el orden en recibo aunque lo parezca: en el seed de ESP el
        codigo y el orden coinciden en las lineas del recibo (701/701), pero
        los tecnicos (D02, B_CC, P_FP_TRAB) no tienen orden y siguen
        mostrando su codigo. Decidido en designer#4; no invertir las lineas.
      */}
      <div className="flex items-start gap-1 px-2 pt-1.5">
        <span className="flex-1 font-mono text-[11px] font-semibold leading-tight">{data.conceptCode}</span>
        {data.onEditSummary && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); data.onEditSummary!(data.conceptCode) }}
            className="px-0.5 text-[9px] text-text-tertiary hover:text-text-primary"
            title="Editar summary"
          >
            ✎
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-2 pb-2">
        <div className="text-[9px] text-text-secondary">{data.conceptMnemonic}</div>
        <div className="text-[9px] text-text-tertiary">
          {NATURE_LABELS[data.functionalNature]} · {CALCULATION_TYPE_LABELS[data.calculationType]}
        </div>

        {data.summary && (
          <div className="mt-0.5 line-clamp-2 text-[9px] italic text-text-tertiary">{data.summary}</div>
        )}

        {/* Puertos de entrada: un punto dice donde estan, el rotulo dice que son */}
        {inputPorts.length > 0 && (
          <div className="mt-1.5 flex flex-col gap-1">
            {inputPorts.map((port) => (
              <div key={port} className="relative flex items-center gap-1">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={port}
                  title={port}
                  className="!h-2 !w-2 !-left-[15px]"
                  style={{ top: 'auto', transform: 'none' }}
                />
                <span className="ml-1 font-mono text-[9px] text-text-tertiary">{port}</span>
              </div>
            ))}
          </div>
        )}

        {/* Puerto de salida */}
        <div className="mt-1 flex justify-end">
          <Handle
            type="source"
            position={Position.Right}
            id="out"
            title="out"
            className="!h-2 !w-2 !-right-[13px]"
            style={{ top: 'auto', transform: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}
