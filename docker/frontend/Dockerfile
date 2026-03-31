FROM node:20-alpine AS build

WORKDIR /repo

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/
RUN npm ci

COPY scripts/sync-db.mjs scripts/
COPY data ./data
COPY frontend ./frontend

# 동일 출처 Nginx 프록시 시 비워둠. 별도 API 도메인이면 빌드 인자로 전달.
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run sync-db && npm run build -w frontend

FROM nginx:alpine

COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/frontend/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
