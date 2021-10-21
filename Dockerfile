FROM node:17
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install \
&& npm run build
COPY . .
EXPOSE 3002
CMD [ "node", "dist/main.js" ]
