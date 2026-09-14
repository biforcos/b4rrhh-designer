/**
 * Los dos mensajes que el modo recibo cruza con quien lo embebe (`designer#8`, punto 6).
 *
 * Son dos y no tres. Falta el evidente —un «ya estoy listo»— y falta a propósito: el marco lo
 * pide el `frontend#66`, que para distinguir «el designer no responde» le basta el `load` del
 * `iframe` y un plazo. Lo que hace innecesario el tercer mensaje es que un `focusConcept` que
 * llegue antes de que el grafo esté cargado **no se pierde**: se guarda y se aplica al cargar.
 *
 * El designer cuelga de `/designer/` del mismo origen que el backoffice, así que no hay frontera
 * que cruzar. Precisamente por eso el origen se comprueba en las dos direcciones y se publica al
 * origen concreto: si algún día alguien mete el marco en otro sitio, esto calla en vez de hablar
 * con quien no debe.
 */
export const FOCUS_CONCEPT_MESSAGE = 'b4rrhh.designer.focusConcept'
export const NODE_CLICKED_MESSAGE = 'b4rrhh.designer.nodeClicked'

/** El código del concepto al que centrarse, o `null` si el mensaje no es para nosotros. */
export function readFocusConceptMessage(event: MessageEvent, expectedOrigin: string): string | null {
  if (event.origin !== expectedOrigin) return null

  const data = event.data
  if (typeof data !== 'object' || data === null) return null

  const { type, conceptCode } = data as { type?: unknown; conceptCode?: unknown }
  if (type !== FOCUS_CONCEPT_MESSAGE) return null
  if (typeof conceptCode !== 'string' || conceptCode.trim() === '') return null

  return conceptCode
}

/**
 * Avisa de que han pinchado un nodo. Sin marco no dice nada: `parent` es la propia ventana y
 * mandarse el mensaje a uno mismo haría creer que hay alguien escuchando.
 */
export function postNodeClicked(
  conceptCode: string,
  parent: Window | null,
  self: Window,
  origin: string,
): void {
  if (!parent || parent === self) return
  parent.postMessage({ type: NODE_CLICKED_MESSAGE, conceptCode }, origin)
}
