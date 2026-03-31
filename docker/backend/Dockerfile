FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/
RUN npm ci --omit=dev

COPY backend/ ./backend/

WORKDIR /app/backend

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "index.js"]
