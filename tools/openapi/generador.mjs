// Lo que sabe este repositorio de generar tipos del contrato, en un solo sitio:
// las rutas y como se invoca el generador. Lo usan `generate-types.mjs`, que
// escribe el fichero versionado, y `check-types.mjs`, que lo regenera aparte
// para comprobar que el versionado no miente (b4rrhh/workspace#4).
//
// Que los dos pasen por aqui no es aseo: si el candado generase de otra forma
// que la generacion, compararia dos cosas distintas y el rojo no diria nada.

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))

export const CONTRATO = 'personnel-administration-api.yaml'
export const repositoryRoot = path.resolve(scriptDirectory, '../..')
export const inputSpec = path.resolve(repositoryRoot, 'openapi', CONTRATO)
export const outputTypes = path.resolve(repositoryRoot, 'src/api/schema.d.ts')

/**
 * Genera los tipos del contrato versionado en `destino`. Sale del proceso con
 * un mensaje si algo falta: quien llama solo se ocupa de que hacer con el
 * fichero, no de comprobar que el generador esta.
 */
export function generarTipos(destino) {
  if (!existsSync(inputSpec)) {
    console.error(`OpenAPI contract not found at ${inputSpec}.`)
    console.error('The contract is versioned in this repository, so a clean checkout always has it.')
    console.error('If it is missing, the checkout is incomplete or the file was deleted locally.')
    console.error('Bring it back from a sibling backend checkout with "npm run api:pull".')
    process.exit(1)
  }

  // La versión sale de la dependencia de package.json, no de un `npx …@7`: dos
  // generadores distintos escriben `schema.d.ts` distinto sin que cambie el
  // contrato (designer#6). Por eso se invoca el binario instalado y no `npx`,
  // que se traeria otro si aqui faltara.
  const generatorCli = path.resolve(repositoryRoot, 'node_modules/openapi-typescript/bin/cli.js')

  if (!existsSync(generatorCli)) {
    console.error('openapi-typescript is not installed. Run "npm install" first.')
    process.exit(1)
  }

  const result = spawnSync(process.execPath, [generatorCli, inputSpec, '-o', destino], {
    cwd: repositoryRoot,
    stdio: 'inherit',
  })

  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
