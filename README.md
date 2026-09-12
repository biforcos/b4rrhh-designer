# B4RRHH Payroll Designer

## Identidad visual

Los iconos de aplicación de `public/` (`favicon.ico`, `favicon.svg`, `apple-touch-icon.png`,
`icon-*.png`, `site.webmanifest`) y el isotipo de `public/brand/` son **copias** de
`b4rrhh_frontend/public/`. La fuente es el generador `b4rrhh_frontend/tools/identidad/build_all.py`
y las reglas de uso están en `b4rrhh_frontend/docs/identidad-visual.md`. No se retocan aquí: si
la marca cambia, se regenera allí y se vuelven a copiar (designer#1). Lo único propio del designer
es el `site.webmanifest`, que cuelga de `/designer/` y lleva su nombre.

---

## Tipos del contrato del backend

`src/api/schema.d.ts` se **genera**, no se escribe. Sale de `openapi/personnel-administration-api.yaml`,
que es una copia versionada del contrato que posee el backend.

```
npm run api:pull       # trae el contrato de un checkout hermano de b4rrhh_backend
npm run api:generate   # genera src/api/schema.d.ts desde la copia local
npm run api:refresh    # las dos cosas
```

El generador es `openapi-typescript`, y su versión está fijada en `package.json`: se invoca el
binario instalado, no un `npx …@7`, porque dos versiones del generador escriben ficheros
distintos sin que cambie el contrato. Hasta el `designer#6` no había ninguna de estas tres cosas
y el fichero llevaba sin regenerarse desde el scaffold.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## License

This project is source-available under a Business Source License (BSL).

Commercial use is not permitted without explicit authorization.

See LICENSE.md for details.