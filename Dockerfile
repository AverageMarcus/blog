FROM node:16-alpine

RUN apk update && apk add python3 make gcc g++

WORKDIR /app

ADD package.json .
RUN npm install

ADD . .

EXPOSE 8000

CMD ["npm", "start"]
