FROM mhart/alpine-node:8.1.3

ENV YARN_VERSION=latest

RUN apk add --no-cache curl &&\
  curl -sSL -O https://yarnpkg.com/${YARN_VERSION}.tar.gz -O https://yarnpkg.com/${YARN_VERSION}.tar.gz.asc && \  
  rm -rf /usr/local/share/yarn && \
  rm /usr/local/bin/yarn && \
  mkdir /usr/local/share/yarn && \
  tar -xf ${YARN_VERSION}.tar.gz -C /usr/local/share/yarn --strip 1 && \
  ln -s /usr/local/share/yarn/bin/yarn /usr/local/bin/ && \
  ln -s /usr/local/share/yarn/bin/yarnpkg /usr/local/bin/ && \
  rm ${YARN_VERSION}.tar.gz*; \
  apk del curl 

RUN yarn --version
