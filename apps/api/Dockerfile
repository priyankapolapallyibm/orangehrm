# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24.19.0

FROM node:${NODE_VERSION}-alpine AS dependencies
WORKDIR /workspace

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

FROM dependencies AS build
COPY apps/api apps/api
RUN npm run prisma:generate --workspace api \
    && npm run build --workspace api

FROM build AS migrate
WORKDIR /workspace/apps/api
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && chown -R 1000:1000 /data"]

FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /workspace

RUN apk add --no-cache openssl \
    && mkdir -p /data \
    && chown node:node /data

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --omit=dev --workspace api --include-workspace-root \
    && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm \
        /usr/local/lib/node_modules/corepack \
        /usr/local/bin/npm \
        /usr/local/bin/npx \
        /usr/local/bin/corepack

COPY --from=build /workspace/node_modules/.prisma /workspace/node_modules/.prisma
COPY --from=build /workspace/apps/api/dist /workspace/apps/api/dist

WORKDIR /workspace/apps/api
USER node
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
