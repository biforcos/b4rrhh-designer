// Lo poco que hace falta para contar en que se diferencian dos ficheros de
// texto, compartido por los dos candados del contrato (b4rrhh/workspace#4).

/**
 * Los finales de linea no son el contrato ni son tipos. Este repositorio los
 * fija a LF por .gitattributes, asi que en CI nunca difieren; normalizar es para
 * que la copia de trabajo de una maquina Windows no saque un rojo que no habla
 * de la API.
 */
export function normalizar(texto) {
  return texto.replace(/\r\n/g, '\n')
}

/**
 * Las lineas que estan en `referencia` y no en `local`, en el orden del fichero.
 * No es un diff de verdad —no alinea bloques— pero contesta la pregunta que se
 * hace quien lee el fallo: que trae lo nuevo que aqui no esta.
 */
function soloEn(referencia, local) {
  const disponibles = new Map()
  for (const linea of local) disponibles.set(linea, (disponibles.get(linea) ?? 0) + 1)

  const sueltas = []
  for (const linea of referencia) {
    const quedan = disponibles.get(linea) ?? 0
    if (quedan > 0) disponibles.set(linea, quedan - 1)
    else sueltas.push(linea)
  }
  return sueltas
}

/** Escribe por stderr en que se diferencian, con una muestra de cada lado. */
export function imprimirDiferencias(textoReferencia, textoLocal, muestra = 10) {
  const faltan = soloEn(textoReferencia.split('\n'), textoLocal.split('\n'))
  const sobran = soloEn(textoLocal.split('\n'), textoReferencia.split('\n'))

  console.error(`  ${faltan.length} linea(s) estan en la referencia y no aqui`)
  console.error(`  ${sobran.length} linea(s) estan aqui y no en la referencia`)
  console.error('')

  for (const linea of faltan.slice(0, muestra)) console.error(`  + ${linea}`)
  if (faltan.length > muestra) console.error(`  + ... y ${faltan.length - muestra} mas`)
  for (const linea of sobran.slice(0, muestra)) console.error(`  - ${linea}`)
  if (sobran.length > muestra) console.error(`  - ... y ${sobran.length - muestra} mas`)
  console.error('')
}
