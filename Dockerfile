FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips \
    libjpeg62-turbo \
    libpng-dev \
    libwebp-dev \
    libtiff-dev \
    libgif-dev \
    libssl-dev \
    libzstd1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package.json /usr/src/app

RUN npm install --omit=dev

COPY . /usr/src/app

CMD [ "node", "server.js" ]