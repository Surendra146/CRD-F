FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS deps
RUN npm ci

FROM deps AS dev
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

FROM deps AS test
COPY . .
CMD ["npm", "run", "test:ci"]

FROM deps AS build
ARG VITE_BACKEND_URL=/
ARG VITE_API_URL=/
ARG VITE_ENABLE_SOCKET_PROGRESS=true
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL \
    VITE_API_URL=$VITE_API_URL \
    VITE_ENABLE_SOCKET_PROGRESS=$VITE_ENABLE_SOCKET_PROGRESS
COPY . .
RUN npm run build

FROM nginx:stable-alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
