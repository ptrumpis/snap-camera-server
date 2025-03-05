FROM node:20

WORKDIR /usr/src/app

COPY package.json /usr/src/app

RUN npm install --omit=dev

COPY . /usr/src/app

CMD [ "node", "server.js" ]