FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips \
    libwebp-dev \
    libpng-dev \
    libjpeg-dev \
    libzstd1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package.json /usr/src/app

RUN npm install --ignore-scripts --omit=dev

COPY . /usr/src/app

CMD [ "node", "server.js" ]