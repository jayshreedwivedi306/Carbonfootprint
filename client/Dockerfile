# Stage 1: Build application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve application with Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Copy default nginx configuration if customization is needed, or run default
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
