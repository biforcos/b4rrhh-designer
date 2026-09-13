// Candado del contrato atrasado (b4rrhh/workspace#4): el contrato versionado en
// este repositorio tiene que ser el de `main` del backend, y el CI se pone rojo
// si no lo es.
//
//   npm run api:check
//
// Por que hace falta, y con fecha: el contrato vive en b4rrhh_backend y de el
// genera sus tipos este repositorio, pero regenerarlos es un paso manual que
// ocurre en OTRO sitio y depende de que alguien se acuerde. El 13/09 este
// repositorio se quedo atras dos veces en la misma tarde: primero 31 lineas por
// los commits de b4rrhh/backend#88 y b4rrhh/backend#85, y horas despues otra vez
// por los de b4rrhh/backend#91. Ninguna de las dos fue descuido: los issues
// pedian por escrito poner al dia el frontend, y ningun issue tiene por que
// acordarse del designer.
//
// Con la copia vieja el repositorio compila contra un contrato que ya no existe,
// y las comprobaciones montadas encima miran al sitio equivocado: dan verde, y
// el verde es peor que el rojo porque nadie lo revisa.
//
// De donde sale el contrato de referencia, por este orden:
//
//   1. CONTRACT_URL — una peticion HTTP a Gitea. Es lo que usa el CI, que no
//      tiene el backend al lado. El token de CONTRACT_TOKEN es de LECTURA sobre
//      el repositorio del contrato: no hace falta mas, y pedir mas es pedir
//      problemas.
//   2. ../b4rrhh_backend/openapi/ — el checkout hermano. Es lo que hay en la
//      maquina de quien desarrolla, y asi no se le pide un token para nada.
//
// El otro medio candado de este repositorio es `check-types.mjs`: aqui se
// comprueba el .yaml contra el backend, y alli lo generado contra el .yaml.
// Hacen falta los dos, porque este repositorio si commitea lo generado.
//
// El mensaje del fallo dice la orden exacta que lo apaga. Un rojo que le sale a
// quien no lo rompio y no dice que hacer se aprende a ignorar, y un guardarrail
// que se ignora deja de proteger justo en el caso que importa (b4rrhh/backend#14).

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { imprimirDiferencias, normalizar } from './diferencias.mjs'
import { CONTRATO, inputSpec, repositoryRoot } from './generador.mjs'

const siblingContractPath = path.resolve(repositoryRoot, '../b4rrhh_backend/openapi', CONTRATO)

const contractUrl = (process.env.CONTRACT_URL ?? '').trim()
const contractToken = (process.env.CONTRACT_TOKEN ?? '').trim()

const ORDEN_DE_ARREGLO = [
  'git -C ../b4rrhh_backend pull',
  'npm run api:refresh',
  `git add openapi/${CONTRATO} src/api/schema.d.ts`,
]

/**
 * Deja el proceso en rojo y devuelve null, que es lo que miran los que llaman.
 * No se usa process.exit(): con una peticion HTTP recien hecha, salir a la brava
 * deja a Node protestando por el socket a medio cerrar.
 */
function fallo(...lineas) {
  for (const linea of lineas) console.error(linea)
  process.exitCode = 1
  return null
}

async function traerDeGitea() {
  if (!contractToken) {
    return fallo(
      'CONTRACT_URL esta puesta pero CONTRACT_TOKEN viene vacia.',
      '',
      'El CI lee el contrato del repositorio del backend, que es privado, con un',
      'token de LECTURA guardado como secreto CONTRACT_TOKEN. Si el secreto no',
      'existe todavia, hay que crearlo en la organizacion b4rrhh.',
    )
  }

  let respuesta
  try {
    respuesta = await fetch(contractUrl, {
      headers: { Authorization: `token ${contractToken}` },
    })
  } catch (error) {
    return fallo(
      `No se pudo pedir el contrato a ${contractUrl}`,
      `  ${error.message}`,
      '',
      'Es un fallo de red o de configuracion, no del contrato.',
    )
  }

  if (!respuesta.ok) {
    return fallo(
      `Gitea contesto ${respuesta.status} al pedir el contrato:`,
      `  ${contractUrl}`,
      '',
      // Gitea devuelve 404 tambien a quien no tiene permiso, no 401: es lo
      // correcto para no revelar que existe, y engana al depurar.
      'Un 404 aqui puede ser que la ruta no exista o que el token no llegue a',
      'ese repositorio: los repos de b4rrhh son privados. Comprueba el secreto',
      'CONTRACT_TOKEN y que tenga lectura sobre b4rrhh/backend.',
    )
  }

  return respuesta.text()
}

function leerDelHermano() {
  if (!existsSync(siblingContractPath)) {
    return fallo(
      'No hay de donde sacar el contrato de referencia.',
      '',
      `  ni por HTTP:  CONTRACT_URL no esta puesta${process.env.CI ? ' (y esto es CI)' : ''}`,
      `  ni al lado:   ${siblingContractPath} no existe`,
      '',
      'En CI el contrato se pide a Gitea con CONTRACT_URL y CONTRACT_TOKEN.',
      'En local basta con tener el checkout de b4rrhh_backend al lado de este.',
    )
  }
  return readFileSync(siblingContractPath, 'utf8')
}

async function comprobar() {
  if (!existsSync(inputSpec)) {
    return fallo(
      `El contrato versionado no esta en ${inputSpec}.`,
      'Esta versionado en este repositorio, asi que un checkout limpio siempre lo trae.',
      'Si falta, el checkout esta incompleto o alguien lo borro en local.',
    )
  }

  const traido = contractUrl ? await traerDeGitea() : leerDelHermano()
  if (traido === null) return

  const origen = contractUrl ? contractUrl : path.relative(repositoryRoot, siblingContractPath)
  const referencia = normalizar(traido)
  const local = normalizar(readFileSync(inputSpec, 'utf8'))

  if (referencia === local) {
    console.log(`api:check: el contrato versionado es el de b4rrhh/backend@main (${origen})`)
    return
  }

  console.error('El contrato versionado en este repositorio no es el de b4rrhh/backend@main.')
  console.error('')
  console.error(`  referencia:  ${origen}`)
  console.error(`  aqui:        openapi/${CONTRATO}`)
  console.error('')
  imprimirDiferencias(referencia, local)
  console.error('Ponlo al dia y commitea el diff:')
  console.error('')
  for (const orden of ORDEN_DE_ARREGLO) console.error(`    ${orden}`)
  console.error('')
  console.error('Aqui entran los dos ficheros: el .yaml y los tipos generados de el, que')
  console.error('en este repositorio si estan versionados.')
  console.error('')
  console.error('Si esto sale rojo justo despues de que el backend cambie el contrato, es')
  console.error('correcto: el contrato va por delante de este repositorio, y las ordenes de')
  console.error('arriba son las que lo apagan. Lo que no vale es dejarlo asi.')
  process.exitCode = 1
}

await comprobar()
