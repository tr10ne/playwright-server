# Playwright Browser Server

Изолированный контейнер с headless-браузером Chromium, управляемым через Playwright Server по WebSocket. Сервис выносит браузерный движок в отдельный контейнер, чтобы клиентские приложения могли подключаться к нему удалённо и выполнять браузерную автоматизацию без локальной установки Chromium.

## Назначение

Playwright Browser Server используется как выделенный браузерный backend для внешних сервисов, например `rosreestr-service`. Клиентское приложение подключается к WebSocket-эндпоинту контейнера через `chromium.connect(...)`, после чего управляет Chromium так, как если бы браузер был запущен локально.

## Архитектура

```text
Клиентский сервис (rosreestr-service)
        │
        │  ws://<playwright-host>:3000/
        ▼
Playwright Server
        │
        ▼
Headless Chromium
        │
        ▼
Внешние веб-ресурсы
```

Контейнер запускает встроенный сервер `playwright run-server`, который принимает WebSocket-подключения и предоставляет удалённый доступ к браузеру.

## Состав репозитория

```text
playwright/
├── Dockerfile
├── docker-compose.yml
└── healthcheck.js
```

## Dockerfile

```dockerfile
FROM node:22-slim

RUN npm install -g playwright-core@1.62 playwright@1.62
RUN npx playwright install --with-deps chromium

COPY healthcheck.js /healthcheck.js

CMD ["npx", "playwright", "run-server", "--port", "3000", "--host", "0.0.0.0"]
```

## Healthcheck

Стандартный `playwright run-server` не поднимает HTTP-эндпоинт вида `/health`, поэтому проверка доступности выполняется через реальное WebSocket-подключение к локальному Playwright Server.

Файл `healthcheck.js`:

```javascript
const { chromium } = require("playwright-core");

(async () => {
  try {
    const browser = await chromium.connect("ws://localhost:3000/", { timeout: 5000 });
    await browser.close();
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
})();
```

Такой healthcheck проверяет не просто наличие открытого TCP-порта, а фактическую готовность Playwright Server принимать клиентские WebSocket-сессии.

## docker-compose.yml

```yaml
services:
  playwright:
    build: ./playwright
    container_name: playwright
    restart: always
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "node", "/healthcheck.js"]
      interval: 15s
      timeout: 10s
      retries: 5
      start_period: 15s
```

## Запуск

```bash
docker-compose up -d --build playwright
```

Проверка состояния контейнера:

```bash
docker ps
docker inspect --format='{{json .State.Health}}' playwright
docker logs -f playwright
```

## Подключение клиента

Пример подключения из Node.js-приложения:

```javascript
const { chromium } = require("playwright-core");

(async () => {
  const browser = await chromium.connect("ws://<playwright-host>:3000/");
  const page = await browser.newPage();
  await page.goto("https://example.com");
  console.log(await page.title());
  await browser.close();
})();
```

`<playwright-host>` — IP-адрес или hostname ВМ, на которой развёрнут контейнер.

## Сетевые требования

- Входящий доступ:
  - `3000/tcp` — WebSocket-доступ к Playwright Server только от доверенных клиентских сервисов.
- Исходящий доступ:
  - HTTPS-доступ к тем внешним сайтам, которые должны открываться в браузере по команде клиента.
  - Для сценария с Rosreestr Lookup Service требуется доступ как минимум к `lk.rosreestr.ru`.

## Безопасность

- Контейнер не содержит встроенной аутентификации на уровне `playwright run-server`, поэтому доступ к порту `3000` должен ограничиваться сетевыми правилами: firewall, Security Group, allow-list по IP.
- Не рекомендуется публиковать порт `3000` в открытый интернет без дополнительного reverse proxy, фильтрации источников и аутентификации.
- При размещении в корпоративном контуре рекомендуется разрешить доступ к порту только с IP-адреса ВМ, на которой работает `rosreestr-service`.

## Совместимость версий

Версия `playwright` и `playwright-core` внутри контейнера должна совпадать с версией Playwright SDK в клиентском приложении. Для этого в данном образе зафиксирована версия `1.62`.

## Ограничения

- Каждый клиентский сеанс создаёт собственное подключение к удалённому браузеру, поэтому при росте числа одновременных задач необходимо учитывать потребление CPU и RAM.
- Healthcheck через WebSocket точнее проверки порта, но создаёт небольшую дополнительную нагрузку, так как периодически открывает и закрывает браузерную сессию.
- При обновлении версии Playwright необходимо одновременно обновлять и серверный контейнер, и клиентские приложения.