FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY . .
RUN npm run build

# Compile the standalone catalog seed (prisma/seed.ts) to CommonJS so it
# runs in the runner with plain `node` — the runner installs prod deps
# only (no ts-node). Mirrors how dist/main.js runs: compiled CJS that
# imports better-auth + @prisma/client.
RUN npx tsc prisma/seed.ts --outDir dist-seed --rootDir prisma \
    --module commonjs --moduleResolution node --esModuleInterop \
    --target es2023 --skipLibCheck

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-seed ./dist-seed

EXPOSE 3000
CMD ["node", "dist/main.js"]
