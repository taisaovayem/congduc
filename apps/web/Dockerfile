FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/

RUN npm install

COPY apps/web ./apps/web

WORKDIR /app/apps/web

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
