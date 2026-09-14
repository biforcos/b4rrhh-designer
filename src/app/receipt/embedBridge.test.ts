import { describe, it, expect, vi } from 'vitest'
import {
  FOCUS_CONCEPT_MESSAGE,
  NODE_CLICKED_MESSAGE,
  postNodeClicked,
  readFocusConceptMessage,
} from './embedBridge'

const ORIGIN = 'https://demo.b4rrhh.test'

function message(data: unknown, origin = ORIGIN): MessageEvent {
  return { data, origin } as MessageEvent
}

describe('readFocusConceptMessage', () => {
  it('lee el concepto de un mensaje bien formado del mismo origen', () => {
    const event = message({ type: FOCUS_CONCEPT_MESSAGE, conceptCode: '101' })

    expect(readFocusConceptMessage(event, ORIGIN)).toBe('101')
  })

  it('no atiende a un mensaje de otro origen aunque venga bien formado', () => {
    const event = message({ type: FOCUS_CONCEPT_MESSAGE, conceptCode: '101' }, 'https://otro.test')

    expect(readFocusConceptMessage(event, ORIGIN)).toBeNull()
  })

  it('ignora un mensaje de otro tipo', () => {
    const event = message({ type: 'webpack-hot-update', conceptCode: '101' })

    expect(readFocusConceptMessage(event, ORIGIN)).toBeNull()
  })

  it('ignora un mensaje sin código de concepto', () => {
    expect(readFocusConceptMessage(message({ type: FOCUS_CONCEPT_MESSAGE }), ORIGIN)).toBeNull()
  })

  it('ignora un código de concepto que no es una cadena con contenido', () => {
    expect(readFocusConceptMessage(message({ type: FOCUS_CONCEPT_MESSAGE, conceptCode: 101 }), ORIGIN)).toBeNull()
    expect(readFocusConceptMessage(message({ type: FOCUS_CONCEPT_MESSAGE, conceptCode: '  ' }), ORIGIN)).toBeNull()
  })

  it('ignora un dato que no es un objeto', () => {
    expect(readFocusConceptMessage(message('101'), ORIGIN)).toBeNull()
    expect(readFocusConceptMessage(message(null), ORIGIN)).toBeNull()
  })
})

describe('postNodeClicked', () => {
  it('publica el nodo pinchado a quien embebe, y al origen concreto, no a «*»', () => {
    const parent = { postMessage: vi.fn() } as unknown as Window

    postNodeClicked('B_CC', parent, window, ORIGIN)

    expect(parent.postMessage).toHaveBeenCalledWith(
      { type: NODE_CLICKED_MESSAGE, conceptCode: 'B_CC' },
      ORIGIN,
    )
  })

  it('no publica nada cuando el designer no está embebido', () => {
    // Sin marco, `window.parent` es la propia ventana: mandarse el mensaje a sí mismo sería ruido
    // y, peor, dejaría creer que hay alguien escuchando.
    const self = { postMessage: vi.fn() } as unknown as Window

    postNodeClicked('B_CC', self, self, ORIGIN)

    expect(self.postMessage).not.toHaveBeenCalled()
  })
})
