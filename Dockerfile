FROM node:14-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm run build
COPY . .
EXPOSE 3002
CMD [ "node", "dist/main.js" ]
