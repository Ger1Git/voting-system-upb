FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
COPY scripts/start-local.sh /app/scripts/start-local.sh
RUN sed -i 's/\r$//' /app/scripts/start-local.sh && chmod +x /app/scripts/start-local.sh

EXPOSE 8545

CMD ["sh", "/app/scripts/start-local.sh"]
