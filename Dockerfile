FROM mhart/alpine-node:7.1.0

# RUN npm i yarn -g
# fix yarn bin links creation concurrency
# npm: /usr/lib/node_modules/yarn/lib/package-linker.js

# for apk version will be: /usr/share/node_modules/yarn/lib

# yarn
RUN apk update && apk upgrade && apk add --no-cache tar  && \
  apk add --no-cache --virtual .yarn-deps curl gnupg && \
  curl -o- -L https://yarnpkg.com/install.sh | sh && \
  apk del .yarn-deps && \
  apk del tar
RUN sed -i -e 's/})(), 4);/})(), 1);/g' /root/.yarn/lib/package-linker.js
ENV PATH /root/.yarn/bin:$PATH