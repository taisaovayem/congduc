FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/

FROM base AS deps
RUN npm ci --workspace=@congduc/web

FROM deps AS build
COPY apps/web ./apps/web
WORKDIR /app/apps/web
ARG VITE_API_URL=
ARG VITE_WS_URL=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
RUN npm run build

FROM nginx:1.27-alpine AS production
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80

FROM deps AS development
COPY apps/web ./apps/web
WORKDIR /app/apps/web
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
