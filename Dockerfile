FROM node:16

WORKDIR /usr/src/app

COPY package.json /usr/src/app

RUN npm install --omit=dev

COPY . /usr/src/app

CMD [ "node", "server.js" ]