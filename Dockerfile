FROM node:lts-slim

WORKDIR /app

COPY *.json ./
COPY src/ src/

RUN npm install
# RUN npm run build

CMD ["npm", "start"]