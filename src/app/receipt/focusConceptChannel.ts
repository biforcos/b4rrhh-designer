import { readFocusConceptMessage } from './embedBridge'

/**
 * El «céntrate en este concepto» que llega de fuera, oído desde antes de que React monte.
 *
 * **Por qué el oyente no vive en el componente.** Quien nos embebe manda el mensaje en cuanto
 * pincha alguien, y eso puede ser en el `load` del marco. En un arranque en frío, el efecto de
 * React que pondría el oyente corre después de ese `load`: medido en el navegador, el mensaje
 * llegaba a la ventana a los 64 ms y el lienzo aparecía a los 502, y el mensaje se perdía. Una cola
 * dentro del componente no arregla eso, porque no se puede encolar lo que ningún oyente ha oído.
 *
 * Así que el oyente lo instala el módulo —`main.tsx` lo arranca antes de renderizar, y los módulos
 * se ejecutan antes de que el `load` se dispare— y lo que no tiene a quién entregar se guarda.
 *
 * Y esto es lo que deja los mensajes en **dos** (`designer#8`, punto 6): sin esto haría falta un
 * tercer mensaje, un «ya estoy listo», para que el cliente supiera cuándo puede hablar.
 *
 * Se guarda **el último** y se entrega **una vez**: dos clics seguidos son una petición, no dos, y
 * un mensaje ya atendido no debe revivir cuando el lienzo se vuelve a montar.
 */
let listening = false
let buffered: string | null = null
let subscriber: ((conceptCode: string) => void) | null = null

function onMessage(event: MessageEvent): void {
  const conceptCode = readFocusConceptMessage(event, window.location.origin)
  if (conceptCode === null) return

  if (subscriber) subscriber(conceptCode)
  else buffered = conceptCode
}

/** Empieza a oír. Idempotente: llamarlo dos veces no entrega el mensaje dos veces. */
export function startFocusConceptChannel(): void {
  if (listening) return
  listening = true
  window.addEventListener('message', onMessage)
}

/**
 * Atiende los mensajes, empezando por el que estuviera esperando. Devuelve cómo dejar de hacerlo.
 *
 * Suscribirse es decir «ya puedo enseñar un concepto»: el lienzo del recibo lo hace cuando está en
 * pantalla, no cuando se monta, porque centrarse en un nodo que todavía no existe no es centrarse.
 */
export function subscribeToFocusConcept(onFocus: (conceptCode: string) => void): () => void {
  startFocusConceptChannel()
  subscriber = onFocus

  if (buffered !== null) {
    const conceptCode = buffered
    buffered = null
    onFocus(conceptCode)
  }

  return () => {
    if (subscriber === onFocus) subscriber = null
  }
}

/** Sólo para los tests: el canal es de módulo y vive lo que vive la pestaña. */
export function resetFocusConceptChannelForTests(): void {
  if (listening) window.removeEventListener('message', onMessage)
  listening = false
  buffered = null
  subscriber = null
}
