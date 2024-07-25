FROM node:22 AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production

COPY . .

FROM node:22-slim
WORKDIR /app
COPY --from=builder /usr/src/app .

# For running the whole stack via compose
COPY ./docker/entrypoint-proxy.sh .
RUN chmod +x ./entrypoint-proxy.sh

# Install postgresql-client for pg_isready, curl for healthcheck
RUN apt-get update && apt-get install -y curl postgresql-client && rm -rf /var/lib/apt/lists/*

USER node
EXPOSE 3000

CMD [ "npm", "start" ]
