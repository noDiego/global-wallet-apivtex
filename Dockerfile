FROM node:14
WORKDIR /usr/src/app
COPY *.json ./
RUN npm install \
&& npm run build
COPY . .
EXPOSE 3002
CMD [ "node", "dist/main.js" ]
