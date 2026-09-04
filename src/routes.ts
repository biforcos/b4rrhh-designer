/**
 * Configuracion de rutas del designer y de sus salidas al backoffice.
 *
 * El designer cuelga de `/designer/` del mismo origen que el backoffice
 * (ver `vite.config.ts`), y se entra a el desde una entrada de menu de alli.
 * La salida natural es volver alli: una ruta del backoffice, fuera del router
 * de React, que se navega con `window.location` y nunca con `navigate`, que
 * la resolveria bajo el basename del designer.
 *
 * El cierre de sesion de verdad vive en el backoffice. El designer no cierra
 * sesion: comparte `localStorage` con la pestaña de al lado y un `clear()`
 * desde aqui la tumbaria tambien.
 */

/** Basename del router del designer. Tiene que coincidir con `base` en `vite.config.ts`. */
export const DESIGNER_BASENAME = '/designer'

/** Adonde lleva «Volver al backoffice». */
export const BACKOFFICE_HOME = '/'
