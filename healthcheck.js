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