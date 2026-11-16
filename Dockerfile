FROM node:22-alpine

RUN apk update && apk add python3 make gcc g++

WORKDIR /app

ADD package.json .
RUN npm install --production

ADD . .

EXPOSE 8000

CMD ["npm", "start"]
