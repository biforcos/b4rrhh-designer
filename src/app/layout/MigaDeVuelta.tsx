import { ArrowLeft } from 'lucide-react'
import { useReciboDeOrigen } from '../../reciboDeOrigenStore'
import { backofficePayrollPath } from '../../routes'

/**
 * «Volver a EMP001000 · 202609», mientras el designer sepa de qué recibo se vino (`designer#13`).
 *
 * <b>Es una miga, no un modo.</b> No inhabilita nada, no cambia de pantalla y no encierra a nadie:
 * quien llegó por el salto puede editar cualquier otra cosa, irse al Canvas y volver, exactamente
 * igual que si hubiera entrado por el menú — porque <b>es</b> lo mismo.
 *
 * Y guardar no la toca: la miga no depende de lo que se haya hecho, sino de que haya un recibo de
 * origen. Llevar de vuelta al recibo al guardar decidiría por el visitante y le quitaría la segunda
 * edición, que es justo lo que va a querer quien entra a cambiar un precio.
 */
export function MigaDeVuelta() {
  const { recibo, olvidar } = useReciboDeOrigen()

  if (!recibo) return null

  function volver() {
    if (!recibo) return
    const destino = backofficePayrollPath(recibo)
    // Se olvida al usarla: la vuelta cierra el camino. Si el visitante se queda en el designer, la
    // miga sigue; si se va, ya no viene de ningún sitio.
    olvidar()
    window.location.assign(destino)
  }

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border-default bg-surface-panel flex-shrink-0">
      <button
        type="button"
        onClick={volver}
        className="flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={12} />
        <span>Volver a</span>
        <span className="font-mono text-text-accent">{recibo.employeeNumber}</span>
        <span className="text-text-tertiary">·</span>
        <span className="font-mono text-text-accent">{recibo.payrollPeriodCode}</span>
      </button>
    </div>
  )
}
