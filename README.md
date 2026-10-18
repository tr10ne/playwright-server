# Playwright Server in Docker

Headless Chromium in one container, reachable over the Playwright Server WebSocket
protocol. Applications connect with `chromium.connect(...)` and drive the browser as
if it were installed locally.

## Why this exists

- **The browser engine lives outside application containers.** One image to update,
  one Chromium version, no per-service `npx playwright install`.
- **`/dev/shm` is configured.** Chromium crashes silently with the default 64 MB;
  `shm_size: 1gb` is set explicitly.
- **The healthcheck actually drives the browser.** It opens a WebSocket, creates a
  context and a page, loads `about:blank` — a wedged browser fails the check instead
  of reporting "port is open".
- **Self-healing.** After `HC_KILL_AFTER` consecutive failures (default 3) the
  healthcheck sends SIGTERM to PID 1 and lets Docker restart the container.

## Quick start

```bash
docker compose up -d --build
```

```js
const { chromium } = require("playwright-core");

const browser = await chromium.connect("ws://127.0.0.1:3000/");
const page = await browser.newPage();
await page.goto("https://example.com");
console.log(await page.title());
await browser.close();
```

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `HC_KILL_AFTER` | `3` | consecutive healthcheck failures before the container restarts itself |

## Notes

- Playwright is pinned (`1.62`): the client must use a matching minor version.
- The server has **no authentication**. Keep port 3000 on a private network and put
  a proxy in front if external access is required.
- `pids_limit: 300` and `mem_limit: 2g` keep a runaway page from taking down the
  host; tune them to your workload.

## Structure

```
Dockerfile          node:22-slim + playwright + chromium
docker-compose.yml  resource limits, shm size, healthcheck
healthcheck.js      WebSocket probe with self-restart
```