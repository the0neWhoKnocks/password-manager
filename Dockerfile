# Preparation
FROM node:10-alpine as passman-prep
COPY --chown=node:node ./package*.json ./
# Create a temporary package.json where things like `version` and `scripts`
# are omitted so the cache of the build step won't be invalidated.
RUN ["node", "-e", " \
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8')); \
  const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf-8')); \
  delete pkg.devDependencies; \
  delete pkg.scripts; \
  delete pkg.version; \
  delete lock.version; \
  fs.writeFileSync('package.json', JSON.stringify(pkg)); \
  fs.writeFileSync('package-lock.json', JSON.stringify(lock)); \
"]

# Setup the environment
FROM node:10-alpine AS release
ENV NODE_ENV=production
ENV APP=/home/node/app
RUN mkdir -p $APP/node_modules && chown -R node:node /home/node/*
WORKDIR $APP
# Copy over package related files from the preperation step to install
# production modules
COPY --chown=node:node --from=passman-prep ./package*.json ./
# Install production dependencies
RUN npm i --only=production --quiet
RUN rm ./package*.json
# Copy locally compiled code to the image
COPY --chown=node:node ./src/client/imgs ./src/client/imgs
COPY --chown=node:node ./src/client/css ./src/client/css
COPY --chown=node:node ./src/client/js ./src/client/js
COPY --chown=node:node ./src/server ./src/server
COPY --chown=node:node ./src/constants.js ./src
# List off contents of final image
RUN ls -la $APP
# Expose the default port from the Server, on the container
EXPOSE 3000
# Start the app
CMD ["node", "src/server"]