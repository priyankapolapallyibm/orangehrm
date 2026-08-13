# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24.19.0

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

COPY apps/web apps/web
RUN npm run build --workspace web

FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime
ENV API_UPSTREAM=http://api:3000 \
    NGINX_ENVSUBST_FILTER=^API_UPSTREAM$

COPY apps/web/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
