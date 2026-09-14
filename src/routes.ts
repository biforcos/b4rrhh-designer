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

/**
 * La ruta del modo recibo: el mismo lienzo, abierto para un recibo concreto (`designer#8`).
 *
 * Las seis partes son la clave de negocio del recibo (`frontend#64`), y el numero de presencia va
 * en la URL porque no se puede suponer: `EMP000001` tiene el suyo en la presencia 2.
 *
 * Cuelga fuera del `AppShell` a proposito: esto se ve dentro de un marco, y una barra de
 * navegacion dentro de un marco es ruido que lleva a sitios que el marco no sabe ensenar.
 */
export const RECEIPT_ROUTE_PATH =
  'recibo/:ruleSystemCode/:employeeTypeCode/:employeeNumber/:payrollPeriodCode/:payrollTypeCode/:presenceNumber'
