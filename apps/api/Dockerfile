FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

FROM base AS deps
RUN npm ci --workspace=@congduc/api

FROM deps AS build
COPY apps/api ./apps/api
WORKDIR /app/apps/api
RUN npm run build

FROM base AS production
RUN npm ci --workspace=@congduc/api --omit=dev
COPY --from=build /app/apps/api/dist ./apps/api/dist
WORKDIR /app/apps/api
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]

FROM deps AS development
COPY apps/api ./apps/api
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["npm", "run", "start:dev"]
