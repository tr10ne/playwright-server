FROM node:22-slim
RUN npm install -g playwright-core@1.62 playwright@1.62
RUN npx playwright install --with-deps chromium
COPY healthcheck.js /healthcheck.js
CMD ["npx", "playwright", "run-server", "--port", "3000", "--host", "0.0.0.0"]