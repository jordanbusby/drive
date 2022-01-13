FROM node:14

RUN addgroup --gid 1001 jordan && \ 
    adduser --uid 1001 --gid 1001 --disabled-password jordan

RUN set -eux; \
    apt-get update; \
# LibreOffice for PDF Conversion by webapp
    apt-get install -y libreoffice;


WORKDIR /var/www/drive

COPY package*.json ./

RUN chown -R 1001:1001 /var/www/drive && \
    npm install -g nodemon

USER jordan

RUN npm install