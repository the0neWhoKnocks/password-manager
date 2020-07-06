# Setup the environment
FROM node:10-alpine AS release
ENV NODE_ENV=production
ENV APP=/home/node/app
RUN mkdir -p $APP/node_modules && chown -R node:node /home/node/*
WORKDIR $APP
# Copy over package related files to install production modules
COPY --chown=node:node ./package*.json ./
# Install production dependencies
RUN npm i --only=production --quiet
# Copy locally compiled code to the image
COPY --chown=node:node ./src ./src
# List off contents of final image
RUN ls -la $APP
# Expose the default port from the Server, on the container
EXPOSE 3000
# Start the app
CMD ["node", "src/server"]