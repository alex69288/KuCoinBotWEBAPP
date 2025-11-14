FROM node:18-alpine

ARG TARGET=production

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN if [ "$TARGET" = "production" ]; then npm run build; fi

FROM nginx:alpine AS production
COPY --from=0 /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

FROM node:18-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]