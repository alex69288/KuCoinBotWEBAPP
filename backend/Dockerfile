FROM node:18-alpine

ARG TARGET=production

RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN if [ "$TARGET" = "production" ]; then npm run build && npm ci --only=production; fi

EXPOSE 8080

CMD ["sh", "-c", "if [ \"$TARGET\" = \"production\" ]; then npm start; else npm run dev; fi"]