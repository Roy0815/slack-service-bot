FROM node:15.14.0-alpine3.10

# Get our slack app
WORKDIR /docker/slack-service-bot
COPY package*.json ./

RUN npm install --production
COPY . .

EXPOSE 8080

# get the scheduler
RUN apk add --update --no-cache bash

RUN ["chmod", "0644", "/docker/slack-service-bot/scripts/crontab.staette"]
RUN ["crontab", "/docker/slack-service-bot/scripts/crontab.staette"]

# execute cron and slack app
CMD crond && node app.js