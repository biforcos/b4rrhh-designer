// Candado del sistema de color (designer#2): el designer se remaqueto sobre los
// tokens del producto y las 548 clases literales de la paleta de Tailwind se
// fueron. Sin este candado vuelven en un mes. Falla si algun fichero de src/
// trae una clase de la paleta (`text-slate-400`, `bg-sky-950`, ...): el color
// va por los nombres del sistema que expone src/index.css (`text-text-tertiary`,
// `bg-surface-panel`, `border-l-success-text`...).
//
//   npm run lint:colors
//
// No hay un stylelint (color-no-hex) al lado, a proposito: el unico CSS del
// proyecto es src/index.css, y ese es justo el fichero donde los hex son
// legitimos (la costura con los tokens del producto). Una regla que lo ignore
// no vigila nada. El dia que aparezca un segundo .css se anade stylelint sin
// ignoreFiles y con index.css como unica excepcion (designer#5).

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'src');
const EXTENSIONS = ['.ts', '.tsx', '.css'];
const PALETTE_CLASS = /-(slate|sky|red|green|amber|violet|emerald|indigo|teal|orange|pink)-[0-9]{2,3}/;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      yield* walk(path);
    } else if (EXTENSIONS.some((ext) => path.endsWith(ext))) {
      yield path;
    }
  }
}

const hits = [];
for (const file of walk(ROOT)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (PALETTE_CLASS.test(line)) {
      hits.push(`${relative(process.cwd(), file).split(sep).join('/')}:${i + 1}: ${line.trim()}`);
    }
  });
}

if (hits.length > 0) {
  console.error(`El color va por tokens (designer#2); ${hits.length} clase(s) de la paleta de Tailwind en src/:`);
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
console.log('lint:colors: sin clases de la paleta de Tailwind en src/');
