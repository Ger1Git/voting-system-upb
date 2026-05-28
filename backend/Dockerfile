FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5122

CMD ["sh", "-c", "npm run db:setup && npm run start"]
