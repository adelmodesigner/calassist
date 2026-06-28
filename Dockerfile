FROM node:20-bullseye

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends python3 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["node", "server/index.js"]
