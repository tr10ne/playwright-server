const fs = require("fs");
const { chromium } = require("playwright-core");

const FAILS_FILE = "/tmp/hc_fails";
const KILL_AFTER = parseInt(process.env.HC_KILL_AFTER || "3", 10);

function readFails() {
  try { return parseInt(fs.readFileSync(FAILS_FILE, "utf8"), 10) || 0; } catch { return 0; }
}

function fail(err) {
  const fails = readFails() + 1;
  try { fs.writeFileSync(FAILS_FILE, String(fails)); } catch {}
  console.error(`healthcheck FAILED (${fails}/${KILL_AFTER}): ${err.message}`);

  if (fails >= KILL_AFTER) {
    console.error("Принудительно перезапускаю контейнер (SIGTERM PID 1)");
    try { fs.unlinkSync(FAILS_FILE); } catch {}
    try { process.kill(1, "SIGTERM"); } catch (e) { console.error(e.message); }
  }
  process.exit(1);
}

(async () => {
  const watchdog = setTimeout(() => fail(new Error("watchdog timeout")), 15000);

  let browser;
  try {
    browser = await chromium.connect("ws://127.0.0.1:3000/", { timeout: 5000 });
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await page.goto("about:blank");
    await ctx.close();
    clearTimeout(watchdog);
    try { fs.unlinkSync(FAILS_FILE); } catch {}
    console.log("healthcheck OK");
    process.exit(0);
  } catch (err) {
    clearTimeout(watchdog);
    fail(err);
  } finally {
    try { await browser?.disconnect(); } catch {}
  }
})();