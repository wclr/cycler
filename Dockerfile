FROM mhart/alpine-node:7.1.0
#install git
RUN apk update && apk upgrade && \
   apk add --no-cache bash git openssh

RUN npm i yarn -g
#RUN npm i @whitecolor/yarn -g
RUN npm i linklocal -g
RUN npm i node-dev -g 
RUN npm i nodemon -g 

RUN npm i chokidar-cli -g
# $SHELL needed for chokidar-cli to work
ENV SHELL /bin/bash 

RUN mkdir /cycler
WORKDIR /cycler

