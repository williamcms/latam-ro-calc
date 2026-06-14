# syntax=docker/dockerfile:1

# ============================================================================
# Base: Node 18 (Angular 16's officially supported LTS — avoids Node 22 quirks)
# Installs dependencies once so they can be cached across the dev/build stages.
# ============================================================================
FROM node:18-alpine AS base
WORKDIR /app
# Copy only the manifest first so `npm install` is cached unless deps change.
# (No package-lock.json in the repo yet, so we use `npm install`, not `npm ci`.)
COPY package.json ./
RUN npm install

# ============================================================================
# dev: live `ng serve` with HMR. Source is bind-mounted via docker-compose,
# so this stage mainly provides node_modules + the Angular CLI. Listens on 4200.
# ============================================================================
FROM base AS dev
COPY . .
EXPOSE 4200
# npm start === ng serve --host 0.0.0.0 --hmr --port 4200
CMD ["npm", "start"]

# ============================================================================
# build: produce the static production bundle in /app/dist/sakai-ng.
# `ng build` defaults to the production configuration in Angular 16.
# ============================================================================
FROM base AS build
COPY . .
RUN npm run build

# ============================================================================
# prod: serve the built static files with nginx (SPA fallback + gzip).
# ============================================================================
FROM nginx:1.27-alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/sakai-ng /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
