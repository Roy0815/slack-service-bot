FROM node:15.14.0-alpine3.10

WORKDIR /docker/slack-arbeitsstunden-bot
COPY package*.json ./

RUN npm install --production
COPY . .

EXPOSE 8080

CMD [ "node", "app.js" ]