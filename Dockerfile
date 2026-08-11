FROM ubuntu:22.04

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    git \
    ca-certificates \
    nodejs \
    npm \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]