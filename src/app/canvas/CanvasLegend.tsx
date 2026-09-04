import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { FunctionalNature } from './types'
import { NATURE_LABELS, NATURE_COLORS } from './conceptLabels'

const NATURES = Object.keys(NATURE_LABELS) as FunctionalNature[]

// Los cuatro trazos de las aristas, dibujados sobre un trocito de tinta: la
// leyenda es papel y los trazos solo existen en blanco sobre el lienzo.
const EDGE_STROKES = [
  { cls: 'border-t border-ink-line',                 label: 'Operando o feed' },
  { cls: 'border-t-2 border-ink-line-active',        label: 'Camino activo' },
  { cls: 'border-t border-dashed border-ink-line',   label: 'Feed negativo' },
  { cls: 'border-t border-dotted border-ink-line',   label: 'Fuera del camino' },
]

/** La marca de una naturaleza en miniatura: la misma franja que lleva el nodo. */
export function NatureSwatch({ nature }: { nature: FunctionalNature }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block h-3 w-4 shrink-0 rounded-[2px] border border-border-strong border-l-[3px] bg-surface-panel',
        NATURE_COLORS[nature],
      )}
    />
  )
}

export function CanvasLegend() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Leyenda"
        className="text-[10px] px-2 py-1 bg-surface-panel border border-border-default text-text-secondary rounded-md shadow-(--shadow-card) hover:bg-surface-hover"
      >
        {open ? '× Leyenda' : '? Leyenda'}
      </button>

      {open && (
        <div className="bg-surface-panel border border-border-default rounded-md shadow-(--shadow-card) p-3 text-[10px] text-text-secondary space-y-3 w-56">
          <section>
            <div className="text-text-tertiary uppercase tracking-wide text-[9px] mb-1.5">Naturaleza</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {NATURES.map(nature => (
                <div key={nature} className="flex items-center gap-1.5">
                  <NatureSwatch nature={nature} />
                  <span className="truncate">{NATURE_LABELS[nature]}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="text-text-tertiary uppercase tracking-wide text-[9px] mb-1.5">Aristas</div>
            <div className="space-y-1.5">
              {EDGE_STROKES.map(({ cls, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span aria-hidden className="inline-flex h-3 w-8 shrink-0 items-center bg-accent-primary px-0.5">
                    <span className={`w-full ${cls}`} />
                  </span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
