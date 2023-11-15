## Base Node image
FROM node:14-alpine as node14-dev-base
# Add any extra base packages below. Comment why they're added for your own 
# sanity later. Add any App specific packages further down (there's a comment).
# - `rsync` for the `dist` setup
# - `tzdata` so the `TZ` env var works for timezones
# - `vim zsh` for development env
RUN apk add --no-cache --update rsync tzdata vim zsh

# Set up a usable terminal experience for development
RUN echo "update-notifier=false" >> /home/node/.npmrc
COPY ./.docker/.vimrc /home/node/.vimrc
COPY ./.docker/.zshrc /home/node/.zshrc
COPY ./.docker/zsh-autosuggestions.zsh /home/node/zsh-autosuggestions.zsh

# start building the base
FROM node14-dev-base as passman--packagejson
# Create a temporary package.json where things like `version` and `scripts`
# are omitted so the cache of the build step won't be invalidated.
COPY --chown=node:node ./package*.json ./
RUN ["node", "-e", " \
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8')); \
  const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf-8')); \
  \
  let preInstallScript; \
  if (pkg.scripts && pkg.scripts.preinstall) preInstallScript = pkg.scripts.preinstall; \
  \
  delete pkg.devDependencies; \
  delete pkg.scripts; \
  delete pkg.version; \
  delete lock.version; \
  \
  if (preInstallScript) pkg.scripts = { preinstall: preInstallScript }; \
  \
  fs.writeFileSync('package.json', JSON.stringify(pkg)); \
  fs.writeFileSync('package-lock.json', JSON.stringify(lock)); \
"]

# Set up the environment
FROM node14-dev-base AS passman
ENV NODE_ENV=production
ENV APP=/home/node/app
ENV IN_CONTAINER=true
RUN mkdir -p $APP/node_modules && chown -R node:node /home/node/*

######
## Add App specific packages below
######
# RUN apk add --no-cache --update <PACKAGE> <PACKAGE> ...

WORKDIR $APP

# Copy over package related files from the preperation step to install
# production modules
COPY --chown=node:node --from=passman--packagejson ./package*.json ./

# Install production dependencies and compile assets
RUN npm i --only=production --quiet --unsafe-perm \
  && rm ./package*.json

# Copy locally compiled code to the image
COPY --chown=node:node ./src/client/imgs ./client/imgs
COPY --chown=node:node ./src/client/css ./client/css
COPY --chown=node:node ./src/client/js ./client/js
COPY --chown=node:node ./src/server ./server
COPY --chown=node:node ./src/constants.js ./

# List off contents of final image
RUN ls -la $APP

# Expose the default port from the Server, on the container
EXPOSE 3000

# Start the app
CMD ["node", "server"]
