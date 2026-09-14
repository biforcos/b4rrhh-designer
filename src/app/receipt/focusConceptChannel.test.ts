import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  resetFocusConceptChannelForTests,
  startFocusConceptChannel,
  subscribeToFocusConcept,
} from './focusConceptChannel'
import { FOCUS_CONCEPT_MESSAGE } from './embedBridge'

function send(conceptCode: string, origin = window.location.origin) {
  window.dispatchEvent(
    new MessageEvent('message', { data: { type: FOCUS_CONCEPT_MESSAGE, conceptCode }, origin }),
  )
}

beforeEach(() => {
  resetFocusConceptChannelForTests()
})

describe('focusConceptChannel', () => {
  it('guarda el mensaje que llega sin nadie suscrito y lo entrega al suscribirse', () => {
    // Es el arranque en frío: quien embebe manda el mensaje al `load` del marco y el efecto de
    // React todavía no ha corrido. Una cola dentro del componente no puede recoger lo que ningún
    // oyente ha oído, así que el oyente lo pone el módulo, antes de que React monte.
    startFocusConceptChannel()
    send('B_CC')

    const recibido = vi.fn()
    subscribeToFocusConcept(recibido)

    expect(recibido).toHaveBeenCalledWith('B_CC')
  })

  it('entrega enseguida el mensaje que llega con alguien suscrito', () => {
    startFocusConceptChannel()
    const recibido = vi.fn()
    subscribeToFocusConcept(recibido)

    send('101')

    expect(recibido).toHaveBeenCalledWith('101')
  })

  it('de dos guardados entrega el último, que es lo que el usuario pidió', () => {
    startFocusConceptChannel()
    send('101')
    send('B_CC')

    const recibido = vi.fn()
    subscribeToFocusConcept(recibido)

    expect(recibido).toHaveBeenCalledTimes(1)
    expect(recibido).toHaveBeenCalledWith('B_CC')
  })

  it('lo guardado se entrega una vez: el siguiente suscriptor no lo revive', () => {
    startFocusConceptChannel()
    send('101')
    subscribeToFocusConcept(vi.fn())()

    const siguiente = vi.fn()
    subscribeToFocusConcept(siguiente)

    expect(siguiente).not.toHaveBeenCalled()
  })

  it('no guarda lo que viene de otro origen', () => {
    startFocusConceptChannel()
    send('B_CC', 'https://otro.test')

    const recibido = vi.fn()
    subscribeToFocusConcept(recibido)

    expect(recibido).not.toHaveBeenCalled()
  })

  it('al desuscribirse deja de recibir, y lo que llegue después espera al siguiente', () => {
    startFocusConceptChannel()
    const recibido = vi.fn()
    const cancelar = subscribeToFocusConcept(recibido)
    cancelar()

    send('101')
    expect(recibido).not.toHaveBeenCalled()

    const siguiente = vi.fn()
    subscribeToFocusConcept(siguiente)
    expect(siguiente).toHaveBeenCalledWith('101')
  })

  it('arrancar el canal dos veces no duplica la entrega', () => {
    startFocusConceptChannel()
    startFocusConceptChannel()

    const recibido = vi.fn()
    subscribeToFocusConcept(recibido)
    send('101')

    expect(recibido).toHaveBeenCalledTimes(1)
  })
})
