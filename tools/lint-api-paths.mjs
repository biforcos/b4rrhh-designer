// El tercer candado del contrato (`b4rrhh/designer#11`): toda ruta de la API que este
// repositorio escribe esta declarada en el contrato.
//
//   npm run lint:api-paths
//
// Por que hace falta. El `b4rrhh/workspace#4` monto aqui dos candados, y los dos son correctos:
//
//   api:check        el .yaml versionado es el de `main` del backend
//   api:check:types  `src/api/schema.d.ts` es lo que sale de generar ese .yaml
//
// La cadena esta entera —contrato del backend → .yaml → schema.d.ts— y **terminaba en un fichero
// que no importaba ni un src**. Las veinte llamadas reales llevaban la ruta escrita a mano, y por
// ahi no pasaba ningun candado: `GET /payroll-engine/{ruleSystemCode}/objects` llevaba meses
// servido, ausente del contrato, y llamado igual. No era una excepcion, era la consecuencia.
//
// Esto es el eslabon que faltaba, y por eso lee `schema.d.ts` y no el `.yaml`: asi los dos
// candados de arriba dejan de proteger un fichero inerte y pasan a proteger **lo que el codigo
// llama**. Si el .yaml se queda atras, `api:check` se pone rojo; si `schema.d.ts` no sale de ese
// .yaml, `api:check:types`; y si una llamada no esta en `schema.d.ts`, esto.
//
// Como decide que es una ruta de la API. No mira `apiFetch(` —la ruta puede venir de un ayudante,
// como `payrollStepsPath`—, sino cualquier literal de `src/` que empiece por uno de los **primeros
// segmentos que el propio contrato declara**. Esa lista no esta escrita aqui: se deriva del
// contrato, asi que un area nueva de la API queda vigilada sola. Y por eso no hay falsos
// positivos con las rutas del enrutador: `canvas`, `objects` y `recibo/...` no empiezan por
// ninguno de ellos. Un control que se dispara en el camino bueno deja de ser un control.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDirectory, '..')
const TYPES = path.resolve(repoRoot, 'src/api/schema.d.ts')
const SRC = path.resolve(repoRoot, 'src')

/**
 * Lo que se llama a proposito y no esta en el contrato, con el motivo.
 *
 * Se mantiene corta y cada linea dice por que. Una excepcion sin motivo es una grieta con
 * permiso.
 */
const FUERA_DEL_CONTRATO = [
  {
    ruta: '/api/dev/auth/token',
    motivo:
      'El emisor de tokens de desarrollo. Vive fuera del contrato a proposito y solo existe con ' +
      'el perfil local del backend: declararlo seria publicarlo.',
  },
]

function rutasDeclaradas() {
  const tipos = leer(TYPES)
  const bloque = tipos.match(/export interface paths \{([\s\S]*?)\n\}/)
  if (!bloque) {
    fallar(
      `No encuentro la interfaz "paths" en ${rel(TYPES)}.\n` +
        'Si openapi-typescript ha cambiado de forma, este script hay que actualizarlo, no borrarlo.',
    )
  }
  const rutas = [...bloque[1].matchAll(/^ {4}"(\/[^"]*)":/gm)].map((m) => m[1])
  if (rutas.length === 0) {
    fallar(`No he leido ninguna ruta de ${rel(TYPES)}. Genera los tipos con "npm run api:generate".`)
  }
  return rutas
}

/**
 * `/payrolls/{a}/{b}/steps` y `/payrolls/${x}/${y}/steps` tienen que ser la misma cosa.
 *
 * Un hueco que ocupa **un segmento entero** es un parametro de ruta. Uno que va pegado a un
 * nombre —`assignments${qs}`— no lo es: es la cadena de consulta, que no forma parte de la ruta
 * declarada. Distinguirlos es lo que evita que el candado salte en el camino bueno.
 */
function normalizar(ruta) {
  return ruta
    .replace(/\$\{[^}]*\}/g, '{}')
    .replace(/\{[^}]*\}/g, '{}')
    .split('?')[0]
    .split('/')
    .map((segmento) => (segmento === '{}' ? segmento : segmento.replaceAll('{}', '')))
    .join('/')
    .replace(/\/+$/, '')
}

function primerosSegmentos(rutas) {
  return new Set(rutas.map((r) => r.split('/')[1]).filter(Boolean))
}

function ficherosDeFuente(dir) {
  const salida = []
  for (const entrada of readdirSync(dir)) {
    const completo = path.join(dir, entrada)
    if (statSync(completo).isDirectory()) {
      salida.push(...ficherosDeFuente(completo))
      continue
    }
    if (!/\.(ts|tsx)$/.test(entrada)) continue
    if (entrada === 'schema.d.ts') continue
    // Un literal de un test no es una llamada que haga la aplicacion: es un caso de prueba, y
    // muchos lo son a proposito de una ruta que no existe. Lo que hay que vigilar es la fuente.
    if (/\.test\.(ts|tsx)$/.test(entrada)) continue
    salida.push(completo)
  }
  return salida
}

/**
 * Los literales —comillas simples, dobles y plantillas— que parecen una ruta de la API.
 *
 * La plantilla se lee entera, con lo que haya dentro de sus huecos: una ruta compuesta a trozos
 * tiene que llegar aqui para que se vea que no cuadra, que es justo lo que no puede pasar en
 * silencio.
 */
function rutasLlamadas(fichero, segmentos) {
  const texto = leer(fichero)
  const encontradas = []
  const literales = [
    ...texto.matchAll(/`([^`]*)`/g),
    ...texto.matchAll(/'([^'\r\n]*)'/g),
    ...texto.matchAll(/"([^"\r\n]*)"/g),
  ]
  for (const [, ruta] of literales) {
    if (!ruta.startsWith('/')) continue
    const segmento = ruta.split('/')[1]
    if (!segmentos.has(segmento)) continue
    encontradas.push(ruta)
  }
  return encontradas
}

function leer(fichero) {
  try {
    return readFileSync(fichero, 'utf8')
  } catch (error) {
    fallar(`No puedo leer ${rel(fichero)}: ${error.message}`)
  }
}

function rel(fichero) {
  return path.relative(repoRoot, fichero)
}

function fallar(mensaje) {
  console.error(`lint:api-paths: ${mensaje}`)
  process.exit(1)
}

const declaradas = rutasDeclaradas()
const declaradasNormalizadas = new Set(declaradas.map(normalizar))
const segmentos = primerosSegmentos(declaradas)
const permitidas = new Set(FUERA_DEL_CONTRATO.map((e) => normalizar(e.ruta)))

const fallos = []
let miradas = 0

for (const fichero of ficherosDeFuente(SRC)) {
  for (const ruta of rutasLlamadas(fichero, segmentos)) {
    miradas += 1
    const normalizada = normalizar(ruta)
    if (declaradasNormalizadas.has(normalizada) || permitidas.has(normalizada)) continue
    fallos.push({ fichero: rel(fichero), ruta, normalizada })
  }
}

if (fallos.length > 0) {
  console.error('lint:api-paths: estas rutas no estan en el contrato\n')
  for (const fallo of fallos) {
    console.error(`  ${fallo.fichero}`)
    console.error(`    llama a  ${fallo.ruta}`)
    console.error(`    o sea    ${fallo.normalizada}\n`)
  }
  console.error('Una ruta servida y no declarada no existe para nadie que genere un cliente, y')
  console.error('es como se colo GET /payroll-engine/{ruleSystemCode}/objects (b4rrhh/designer#11).')
  console.error('')
  console.error('Las salidas son dos, y las dos son de verdad:')
  console.error('')
  console.error('  1. Que entre en el contrato. Se escribe en el backend, y aqui:')
  console.error('       git -C ../b4rrhh_backend pull && npm run api:refresh')
  console.error('  2. Que no se llame. Si la ruta esta fuera del contrato a proposito -como el')
  console.error('     emisor de tokens de desarrollo-, se anade a FUERA_DEL_CONTRATO en')
  console.error('     tools/lint-api-paths.mjs, con el motivo escrito.')
  process.exit(1)
}

console.log(
  `lint:api-paths: las ${miradas} rutas que llama src/ estan en el contrato ` +
    `(${declaradas.length} declaradas en ${rel(TYPES)})`,
)
