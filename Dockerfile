# ── Etapa 1: construir la SPA ────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# package*.json primero: mientras no cambien las dependencias, Docker reutiliza
# la capa del npm ci, que es la que tarda.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# El base /designer/ no se pasa aqui: vive en vite.config.ts, para que el build
# de desarrollo y el de la imagen produzcan exactamente lo mismo.
RUN npm run build

# ── Etapa 2: servir ──────────────────────────────────────────────────
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
# Bajo /designer para que la ruta del fichero coincida con la de la URL: asi el
# try_files del nginx no necesita alias, que es donde se cuelan los errores.
COPY --from=build /app/dist /usr/share/nginx/html/designer

EXPOSE 80
