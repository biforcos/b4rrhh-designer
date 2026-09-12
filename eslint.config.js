import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // `src/components/ui` son las primitivas de shadcn/ui: se traen con `shadcn add` y se
    // sobrescriben al volver a traerlas. Exportar el `cva` junto al componente —`buttonVariants`,
    // `badgeVariants`— es la forma de aguas arriba, y aquí no se toca: corregirlo a mano convierte
    // cada actualización de shadcn en un conflicto. La regla se relaja solo para esos nombres y
    // solo en esa carpeta, que es donde deja de aplicar (designer#6).
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ['badgeVariants', 'buttonVariants'] },
      ],
    },
  },
])
