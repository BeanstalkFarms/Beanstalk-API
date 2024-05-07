FROM node:22 as builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production

COPY . .

FROM node:22-slim
WORKDIR /app
COPY --from=builder /usr/src/app .

# For healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

USER node
EXPOSE 3000

CMD [ "npm", "start" ]
