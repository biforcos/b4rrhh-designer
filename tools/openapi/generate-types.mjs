import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(scriptDirectory, '../..')
const inputSpec = path.resolve(repositoryRoot, 'openapi/personnel-administration-api.yaml')
const outputTypes = path.resolve(repositoryRoot, 'src/api/schema.d.ts')

if (!existsSync(inputSpec)) {
  console.error(`OpenAPI contract not found at ${inputSpec}.`)
  console.error('The contract is versioned in this repository, so a clean checkout always has it.')
  console.error('If it is missing, the checkout is incomplete or the file was deleted locally.')
  console.error('Bring it back from a sibling backend checkout with "npm run api:pull".')
  process.exit(1)
}

// La versión sale de la dependencia de package.json, no de un `npx …@7`: dos generadores
// distintos escriben `schema.d.ts` distinto sin que cambie el contrato (designer#6). Por eso se
// invoca el binario instalado y no `npx`, que se traeria otro si aqui faltara.
const generatorCli = path.resolve(repositoryRoot, 'node_modules/openapi-typescript/bin/cli.js')

if (!existsSync(generatorCli)) {
  console.error('openapi-typescript is not installed. Run "npm install" first.')
  process.exit(1)
}

const result = spawnSync(process.execPath, [generatorCli, inputSpec, '-o', outputTypes], {
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

console.log(`Types generated at ${outputTypes}`)
