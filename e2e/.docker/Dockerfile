# Registry: https://mcr.microsoft.com/en-us/artifact/mar/playwright/tags
# Release Notes: https://github.com/microsoft/playwright/releases
FROM mcr.microsoft.com/playwright:v1.53.2-noble AS playwright_v1

# Runner modules
RUN npm i -g -E @playwright/test@1.53.2 \
  # create symlink so global modules can be found
  && ln -s /usr/lib/node_modules /node_modules

ENV NODE_PATH /node_modules
  
RUN mkdir /e2e && chown pwuser:pwuser /e2e

WORKDIR /e2e

USER pwuser

RUN mkdir ./results
