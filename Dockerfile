FROM node:12-alpine

ADD . .

RUN npm install

EXPOSE 8000

CMD ["npm", "start"]
