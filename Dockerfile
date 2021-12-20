# hadolint ignore=DL3007
FROM registry.gitlab.com/cencosud-ds/cencommerce/utils/docker-images/new-relic-builder:latest as newrelic
RUN /tmp/get-new-relic-js.sh


FROM registry.gitlab.com/cencosud-ds/cencommerce/utils/docker-images/node:14-alpine AS development
WORKDIR /usr/src/application
COPY package*.json ./
COPY --from=newrelic /tmp/newrelic.js .

RUN npm install glob@7.2.0 rimraf@3.0.2 \
&& npm install --only=development
COPY . .
RUN npm run build

FROM registry.gitlab.com/cencosud-ds/cencommerce/utils/docker-images/node:14-alpine as production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/src/application
COPY package*.json ./
RUN npm install --only=production
COPY . .
COPY --from=development /usr/src/application/dist ./dist
CMD ["node", "dist/main"]
