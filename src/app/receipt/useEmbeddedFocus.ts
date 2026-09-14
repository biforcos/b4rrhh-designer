import { useEffect } from 'react'
import { startFocusConceptChannel, subscribeToFocusConcept } from './focusConceptChannel'

interface Options {
  /** Si el grafo ya está en pantalla. Mientras no lo esté, un mensaje espera en vez de perderse. */
  graphLoaded: boolean
  onFocus: (conceptCode: string) => void
}

/**
 * Atiende el «céntrate en este concepto» que manda quien nos embebe.
 *
 * Suscribirse sólo con el grafo en pantalla es el punto: el marco del `frontend#66` manda el
 * mensaje en cuanto pincha alguien, y el recibo puede estar todavía pidiendo los conceptos y los
 * pasos. Lo que llegue antes lo guarda el canal —que oye desde antes de que React monte— y se
 * entrega en cuanto hay grafo. Por eso el cliente no necesita saber cuándo estamos listos, y por
 * eso los mensajes siguen siendo dos (`designer#8`, punto 6).
 */
export function useEmbeddedFocus({ graphLoaded, onFocus }: Options): void {
  // Oír no depende de estar listo para enseñar: el canal se arranca en cuanto esta pantalla
  // existe, y `main.tsx` lo arranca antes incluso, al cargar el módulo.
  useEffect(() => {
    startFocusConceptChannel()
  }, [])

  useEffect(() => {
    if (!graphLoaded) return
    return subscribeToFocusConcept(onFocus)
  }, [graphLoaded, onFocus])
}
