# Use debian slim and install Node.js from nodejs.org (generic x86_64, no AVX requirement)
FROM debian:bookworm-slim AS builder

RUN apt-get update && apt-get install -y curl xz-utils && \
    curl -fsSL https://nodejs.org/dist/v20.18.3/node-v20.18.3-linux-x64.tar.xz \
      | tar -xJ -C /usr/local --strip-components=1 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production image
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y curl xz-utils && \
    curl -fsSL https://nodejs.org/dist/v20.18.3/node-v20.18.3-linux-x64.tar.xz \
      | tar -xJ -C /usr/local --strip-components=1 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/server.js"]
