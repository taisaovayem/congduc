FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/

RUN npm install

COPY apps/api ./apps/api

WORKDIR /app/apps/api

CMD ["npm", "run", "start:dev"]
