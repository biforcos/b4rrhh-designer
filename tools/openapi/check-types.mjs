// Candado de los tipos atrasados (b4rrhh/workspace#4): src/api/schema.d.ts
// tiene que ser lo que sale de generar el contrato versionado en openapi/.
//
//   npm run api:check:types
//
// Este es el medio candado que le falta a este repositorio y que el frontend no
// necesita: alli el cliente generado esta en .gitignore y el CI lo fabrica en
// cada build, asi que no puede estar viejo. Aqui schema.d.ts SI se commitea, y
// entonces puede mentir por su cuenta: basta con traer el .yaml nuevo y no
// regenerar, que es un `api:pull` sin su `api:generate`.
//
// No necesita red ni token: se regenera al lado, en node_modules/.cache, y se
// compara. El fichero versionado no se toca.

import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { imprimirDiferencias, normalizar } from './diferencias.mjs'
import { generarTipos, outputTypes, repositoryRoot } from './generador.mjs'

const cacheDirectory = path.resolve(repositoryRoot, 'node_modules/.cache/b4rrhh')
const comprobacion = path.resolve(cacheDirectory, 'schema.check.d.ts')
const versionado = path.relative(repositoryRoot, outputTypes).split(path.sep).join('/')

function comprobar() {
  if (!existsSync(outputTypes)) {
    console.error(`Los tipos versionados no estan en ${outputTypes}.`)
    console.error('Estan versionados en este repositorio, asi que un checkout limpio los trae.')
    console.error('Generalos con "npm run api:generate" y commitealos.')
    process.exitCode = 1
    return
  }

  mkdirSync(cacheDirectory, { recursive: true })
  generarTipos(comprobacion)

  const recienGenerado = normalizar(readFileSync(comprobacion, 'utf8'))
  const enElRepositorio = normalizar(readFileSync(outputTypes, 'utf8'))

  if (recienGenerado === enElRepositorio) {
    console.log(`api:check:types: ${versionado} es lo que sale del contrato versionado`)
    return
  }

  console.error(`${versionado} no es lo que sale de generar el contrato versionado.`)
  console.error('')
  console.error('  referencia:  openapi/personnel-administration-api.yaml, generado ahora')
  console.error(`  aqui:        ${versionado}`)
  console.error('')
  imprimirDiferencias(recienGenerado, enElRepositorio)
  console.error('Regeneralos y commitea el diff:')
  console.error('')
  console.error('    npm run api:generate')
  console.error(`    git add ${versionado}`)
  console.error('')
  console.error('Si el contrato de openapi/ tambien va atrasado, "npm run api:check" lo dira,')
  console.error('y la orden que lo arregla todo de una vez es "npm run api:refresh".')
  process.exitCode = 1
}

comprobar()
