FROM node:20-alpine

ARG TARGET=production

RUN apk add --no-cache curl

WORKDIR /app

RUN mkdir -p /app/cache

COPY package*.json ./
RUN npm ci --include=dev
RUN npm install i18next

RUN npm list i18next

RUN npm list --depth=0

RUN ls -la /app/node_modules && node -v && npm -v

RUN npm install --force
RUN npm rebuild

RUN ls -la /app/node_modules/i18next

RUN node -e "console.log(require('i18next').version)"
RUN node -e "try{console.log('resolve:', require.resolve('i18next'))}catch(e){console.log('resolve error',e.message)}"
RUN node -e "try{console.log(require('i18next/package.json'))}catch(e){console.log('package.json read error',e.message)}"

RUN npm install -g nodemon
RUN npm install -g ts-node

COPY . .
RUN if [ "$TARGET" = "production" ]; then npm run build && npm ci --only=production; fi

EXPOSE 8080

CMD ["nodemon", "--watch", "./**/*.ts", "--exec", "node", "--loader", "ts-node/esm", "src/index.ts"]