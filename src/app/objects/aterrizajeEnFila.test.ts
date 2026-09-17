import { leerAterrizaje, leerReciboDeOrigen, escribirReciboDeOrigen } from './aterrizajeEnFila'

/**
 * La dirección con la que se aterriza en una fila (`designer#13`).
 *
 * Lo que se sujeta aquí es la frontera: estos tres nombres los escribe el recibo del backoffice,
 * que vive en otro repositorio. Si alguno cambia, lo que se rompe es el salto, en silencio y sólo
 * en el navegador.
 */
describe('leerAterrizaje', () => {
  it('lee la tabla y la fila', () => {
    const params = new URLSearchParams('tabla=P02_99002405011982&fila=7')

    expect(leerAterrizaje(params)).toEqual({ tableCode: 'P02_99002405011982', rowId: 7 })
  })

  it('sin fila abre la tabla entera, que es una direccion legitima', () => {
    expect(leerAterrizaje(new URLSearchParams('tabla=P02_99002405011982'))).toEqual({
      tableCode: 'P02_99002405011982',
      rowId: null,
    })
  })

  // Lo contrario no existe: la pantalla se abre por tabla, asi que una fila suelta no lleva a
  // ningun sitio y no es media direccion, es ninguna.
  it('sin tabla no hay aterrizaje aunque venga la fila', () => {
    expect(leerAterrizaje(new URLSearchParams('fila=7'))).toBeNull()
  })

  // Mejor abrir la tabla sin senalar nada que no abrir nada por un numero mal escrito.
  it.each(['0', '-3', 'siete', ''])('una fila imposible (%s) conserva la tabla', (fila) => {
    expect(leerAterrizaje(new URLSearchParams(`tabla=T&fila=${fila}`))).toEqual({
      tableCode: 'T',
      rowId: null,
    })
  })
})

describe('leerReciboDeOrigen', () => {
  it('lee las seis partes, con el numero de presencia entero', () => {
    const params = new URLSearchParams('recibo=ESP/INTERNAL/EMP001000/202609/NORMAL/2')

    expect(leerReciboDeOrigen(params)).toEqual({
      ruleSystemCode: 'ESP',
      employeeTypeCode: 'INTERNAL',
      employeeNumber: 'EMP001000',
      payrollPeriodCode: '202609',
      payrollTypeCode: 'NORMAL',
      presenceNumber: 2,
    })
  })

  it('sin recibo no hay miga de vuelta', () => {
    expect(leerReciboDeOrigen(new URLSearchParams('tabla=T&fila=7'))).toBeNull()
  })

  // El numero de presencia es la parte que se olvida: `EMP000001` tiene su recibo en la 2, asi que
  // una direccion de cinco partes no es «la presencia 1», es una direccion rota.
  it.each([
    'ESP/INTERNAL/EMP001000/202609/NORMAL',
    'ESP/INTERNAL/EMP001000/202609/NORMAL/2/3',
    'ESP/INTERNAL/EMP001000/202609/MENSUAL/2',
    'ESP/INTERNAL/EMP001000/202609/NORMAL/0',
  ])('una direccion imposible (%s) es nula y no se adivina', (crudo) => {
    expect(leerReciboDeOrigen(new URLSearchParams(`recibo=${crudo}`))).toBeNull()
  })
})

it('lo que se escribe se vuelve a leer igual', () => {
  const recibo = {
    ruleSystemCode: 'ESP',
    employeeTypeCode: 'INTERNAL',
    employeeNumber: 'EMP001000',
    payrollPeriodCode: '202609',
    payrollTypeCode: 'NORMAL',
    presenceNumber: 2,
  }

  const params = new URLSearchParams()
  params.set('recibo', escribirReciboDeOrigen(recibo))

  expect(leerReciboDeOrigen(params)).toEqual(recibo)
})
