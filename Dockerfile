FROM ubuntu:22.04

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    git \
    ca-certificates \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22 + npm
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && node --version \
    && npm --version

# Install dependencies
COPY package*.json ./

RUN npm install

# Copy backend source
COPY . .

# Build backend
RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]