#Stage 1
FROM node:latest as builder
WORKDIR /app
COPY package*.json .
COPY npm*.lock .
RUN npm install
COPY . .
RUN npm run build

#Stage 2
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist .
ENTRYPOINT ["nginx", "-g", "daemon off;"]
