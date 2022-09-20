FROM node:16.14.0

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json /app

RUN npm install

# Bundle app source
COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]