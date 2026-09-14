import { NATURE_LABELS, SCOPE_LABELS } from '../canvas/conceptLabels'
import type { ConceptFlowNode } from '../canvas/types'
import { formatAmount, formatSegment } from './receiptFormat'
import type { ReceiptNodeValue } from './receiptValues'

interface Props {
  node: ConceptFlowNode
  value: ReceiptNodeValue
}

/**
 * El panel del modo recibo: qué es este concepto y qué dijo de él **este** recibo.
 *
 * No es el `ConceptDetailPanel` con los botones apagados: es otro panel, y no tiene camino de
 * escritura porque no lo tiene, no porque esté deshabilitado. Es la misma decisión que hizo bueno
 * al `designer#10`, y aquí tiene además una razón práctica: el guardado del designer es una llamada
 * por nodo y sin transacción (`designer#9`), y un modo que no guarda no puede tropezar con eso.
 *
 * Es donde viven los dos pasos del mes partido con sus fechas, sus cantidades y sus tarifas. El
 * nodo lleva la marca —«2 tramos»— y aquí está el detalle: el nodo dice que el cálculo no fue
 * simple y el panel dice cómo fue.
 */
export function ReceiptConceptPanel({ node, value }: Props) {
  const d = node.data

  return (
    <aside className="flex w-64 flex-shrink-0 flex-col gap-4 overflow-y-auto border-l border-border-default bg-surface-panel p-3 text-xs text-text-primary">
      <div>
        <div className="font-mono text-sm font-semibold leading-tight text-text-primary">
          {d.conceptCode}
        </div>
        <div className="mt-0.5 text-[10px] text-text-secondary">{d.conceptMnemonic}</div>
      </div>

      <section className="space-y-2">
        <SectionHeader label="Este recibo" />
        <ReceiptDetail value={value} />
      </section>

      <section className="space-y-2">
        <SectionHeader label="Cálculo" />
        <Field label="Tipo de cálculo" value={d.calculationType} mono />
        <Field label="Ámbito" value={SCOPE_LABELS[d.executionScope]} />
      </section>

      <section className="space-y-2">
        <SectionHeader label="Nómina" />
        <Field label="Naturaleza" value={NATURE_LABELS[d.functionalNature] ?? d.functionalNature} />
        <Field label="Orden en recibo" value={d.payslipOrderCode} mono />
      </section>

      {d.summary && (
        <section className="space-y-1.5">
          <SectionHeader label="Summary" />
          <p className="text-[10px] leading-relaxed text-text-secondary">{d.summary}</p>
        </section>
      )}
    </aside>
  )
}

function ReceiptDetail({ value }: { value: ReceiptNodeValue }) {
  if (value.kind === 'absent') {
    return (
      <div className="space-y-1">
        <p className="text-[11px] font-medium text-text-primary">No participó en este recibo.</p>
        <p className="text-[9px] leading-relaxed text-text-tertiary">
          El concepto existe en el grafo y el motor no lo evaluó para este recibo. No es un cero: es
          que no hubo paso.
        </p>
      </div>
    )
  }

  if (value.kind === 'single') {
    const { amount, quantity, rate, executionOrder, payslipOrderCode } = value.step
    return (
      <div className="space-y-2">
        <div className="font-mono text-base font-semibold tabular-nums">{formatAmount(amount)}</div>
        {quantity != null && rate != null && (
          <Field
            label="Cantidad × tarifa"
            value={`${formatAmount(quantity)} × ${formatAmount(rate)}`}
            mono
          />
        )}
        <Field label="Paso nº" value={String(executionOrder)} mono />
        <Field label="Llegó al folio" value={payslipOrderCode ?? 'No'} mono />
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] leading-relaxed text-warning-text">
        {value.steps.length} tramos. El motor evaluó este concepto una vez por segmento, y cada
        tramo tuvo su propio número.
      </p>
      <table className="w-full text-[9px] tabular-nums">
        <thead>
          <tr className="text-text-tertiary">
            <th className="text-left font-normal">Tramo</th>
            <th className="text-right font-normal">Cant.</th>
            <th className="text-right font-normal">Tarifa</th>
            <th className="text-right font-normal">Importe</th>
          </tr>
        </thead>
        <tbody>
          {value.steps.map((step, index) => (
            <tr key={step.executionOrder}>
              <td className="font-mono text-text-secondary">
                {formatSegment(step.segmentStartDate, step.segmentEndDate, index + 1)}
              </td>
              <td className="text-right font-mono">
                {step.quantity != null ? formatAmount(step.quantity) : '—'}
              </td>
              <td className="text-right font-mono">
                {step.rate != null ? formatAmount(step.rate) : '—'}
              </td>
              <td className="text-right font-mono font-semibold">{formatAmount(step.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/*
        No hay fila de total, y es la decisión del punto 3 del `designer#8` escrita donde se ve:
        de los cuatro conceptos que repiten en el mes partido, sumar sólo significa algo en dos.
        1,00 y 0,50 de jornada no son 1,5 jornadas, y 47,50 y 23,75 de precio/día no son 71,25.
        El total de período que alguien busca para el 101 lo calcula el 970, que está en el grafo.
      */}
      <p className="text-[9px] leading-relaxed text-text-tertiary">
        No se suman: un importe se sumaría, pero una jornada o un precio por día no. El total de
        período, cuando existe, es un concepto propio del grafo.
      </p>
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="border-b border-border-default pb-1 text-[9px] font-semibold uppercase tracking-widest text-text-tertiary">
      {label}
    </div>
  )
}

// Un valor de solo lectura no va en caja: una caja tiene la forma de un <input> e invita a hacer
// clic. En este panel no hay ninguna caja, porque no hay nada que tocar.
function Field({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string | null | undefined
  mono?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-[11px]">
      <span className="shrink-0 text-text-secondary">{label}</span>
      {value != null ? (
        <span className={`text-right text-text-primary${mono ? ' font-mono' : ''}`}>{value}</span>
      ) : (
        <span className="italic text-text-tertiary">—</span>
      )}
    </div>
  )
}
