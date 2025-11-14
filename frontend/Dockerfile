FROM node:22 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.29.3-alpine3.22-slim

COPY --from=build /app/dist /usr/share/nginx/html

# En build time, decidimos qué configuración usar
# Por defecto usamos nginx_fly_io.conf para producción en Fly.io
# Para docker-compose, pasar: --build-arg NGINX_CONF=nginx.conf
ARG NGINX_CONF=nginx_fly_io.conf
COPY $NGINX_CONF /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
