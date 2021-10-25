FROM registry.gitlab.com/cencosud-ds/cencommerce/utils/docker-images/node:14-alpine AS development
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install glob@7.2.0 rimraf@3.0.2 \
&& RUN npm install --only=development
COPY . .
RUN npm run build

FROM registry.gitlab.com/cencosud-ds/cencommerce/utils/docker-images/node:14-alpine as production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production
COPY . .
COPY --from=development /usr/src/app/dist ./dist
CMD ["node", "dist/main"]
