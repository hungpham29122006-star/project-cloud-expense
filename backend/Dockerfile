FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY server.js ./
ARG APP_VERSION=v1
ENV APP_VERSION=$APP_VERSION
EXPOSE 8080
USER node
CMD ["node", "server.js"]
