/**
 * Configuracion de rutas del designer y de sus salidas al backoffice.
 *
 * El designer cuelga de `/designer/` del mismo origen que el backoffice
 * (ver `vite.config.ts`), y se entra a el desde una entrada de menu de alli.
 * Las salidas —volver, o pedir sesion cuando no la hay— son rutas del
 * backoffice, fuera del router de React: se navegan con `window.location`,
 * nunca con `navigate` ni `<Navigate>`, que las resolverian bajo el basename
 * del designer.
 *
 * El cierre de sesion de verdad vive en el backoffice. El designer no cierra
 * sesion: comparte `localStorage` con la pestaña de al lado y un `clear()`
 * desde aqui la tumbaria tambien.
 */

/** Basename del router del designer. Tiene que coincidir con `base` en `vite.config.ts`. */
export const DESIGNER_BASENAME = '/designer'

/** Adonde lleva «Volver al backoffice». */
export const BACKOFFICE_HOME = '/'

/**
 * Login del backoffice, al que se manda a quien llega sin sesion. El del
 * designer (`/designer/login`) sigue existiendo como puerta de emergencia
 * para el arranque en frio, pero no es adonde se redirige.
 */
export const BACKOFFICE_LOGIN = '/login'
