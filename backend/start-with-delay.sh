#!/bin/sh
# Задержка перед запуском nodemon
sleep 25
npx nodemon --watch src --exec "npx tsx src/index.ts"