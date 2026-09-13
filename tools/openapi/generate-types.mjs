// Escribe src/api/schema.d.ts a partir del contrato versionado en openapi/.
//
//   npm run api:generate
//
// Lo que sabe de rutas y de como se invoca el generador esta en `generador.mjs`,
// compartido con el candado `check-types.mjs` (b4rrhh/workspace#4).

import { generarTipos, outputTypes } from './generador.mjs'

generarTipos(outputTypes)

console.log(`Types generated at ${outputTypes}`)
