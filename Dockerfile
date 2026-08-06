FROM node:22-slim
RUN npm install -g playwright-core@1.62 playwright@1.62
RUN npx playwright install --with-deps chromium
ENV NODE_PATH=/usr/local/lib/node_modules
COPY healthcheck.js /healthcheck.js
CMD ["npx", "playwright", "run-server", "--port", "3000", "--host", "0.0.0.0"]