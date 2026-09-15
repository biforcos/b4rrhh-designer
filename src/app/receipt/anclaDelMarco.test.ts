import { describe, it, expect } from 'vitest'

// `?raw` y no `node:fs`: el tsconfig de la aplicacion no le da los tipos de node a `src`, y
// ensanchar eso para un test seria pagar un cambio de configuracion de todo el proyecto por dos
// afirmaciones. Vite trae esto tipado de serie y lee los ficheros de verdad, que es lo unico que
// hace falta aqui.
import indexHtml from '../../../index.html?raw'
import mainSource from '../../main.tsx?raw'

/**
 * El `#root` del `index.html` no es sólo de React: es un acuerdo con el backoffice.
 *
 * Cuando el backoffice abre este diseñador dentro de un marco, comprueba que dentro hay de verdad
 * un diseñador y lo que mira es `contentDocument.getElementById('root')`. Si aquí se renombrara el
 * ancla —a `app`, a `main`, a lo que Vite ponga por defecto el día que alguien rehaga el
 * `index.html`—, el diseñador seguiría arrancando perfectamente y la pestaña del recibo diría
 * «dentro no está el diseñador» con el diseñador delante.
 *
 * Ese acuerdo estaba vigilado **sólo desde el otro repositorio** (`designer-embed.spec.ts`), y allí
 * con un `skipIf` que salta cuando el checkout hermano no está — o sea, en el sitio donde se mira
 * de verdad. Así que quien podía romperlo era el único que no se enteraba (`designer#11`).
 *
 * Si algún día el backoffice deja de mirar el `#root`, este test se borra **con** aquél, no antes:
 * lo que sujeta es el acuerdo, y un acuerdo no lo deshace un solo lado.
 */
describe('el ancla que el backoffice busca dentro del marco', () => {
  it('el index.html trae el div con id="root"', () => {
    expect(indexHtml).toContain('id="root"')
  })

  it('y es el mismo al que React se monta, no dos anclas que casualmente coinciden', () => {
    expect(mainSource).toContain("getElementById('root')")
  })
})
