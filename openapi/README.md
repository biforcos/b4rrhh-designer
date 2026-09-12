# Contrato OpenAPI

`personnel-administration-api.yaml` es una **copia versionada** del contrato que posee el
backend (`b4rrhh_backend/openapi/personnel-administration-api.yaml`). No se edita aquí: los
cambios de API empiezan en el backend.

Está versionada a propósito, para que un cambio en `src/api/schema.d.ts` se pueda leer junto
al cambio de contrato que lo causa. Sin ella, los tipos cambian y nadie sabe por qué
(`designer#6`).

- `npm run api:pull` la trae de un checkout hermano del backend.
- `npm run api:generate` genera `src/api/schema.d.ts` desde esta copia.
- `npm run api:refresh` hace las dos cosas.
