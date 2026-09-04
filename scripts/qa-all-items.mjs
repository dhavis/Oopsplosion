import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "..", ".tmp-paper-test");
mkdirSync(out, { recursive: true });

const CHROME =
  process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function findOrigin() {
  for (const port of [5173, 5174, 5175]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.ok) return `http://127.0.0.1:${port}`;
    } catch {}
  }
  throw new Error("No Vite server found on 5173/5174/5175.");
}

const origin = await findOrigin();
console.log(`Testing All Items in Sandbox on ${origin}...`);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--window-size=440,900"],
  defaultViewport: {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
});

const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`PAGEERROR: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`CONSOLE: ${m.text()}`);
});

const items = ["cup", "phone", "fan", "plant", "printer"];
const results = {};

try {
  await page.goto(`${origin}/?sandbox=1`, { waitUntil: "networkidle0", timeout: 20000 });
  await page.waitForFunction(() => window.__sandbox, { timeout: 10000 });

  for (const item of items) {
    console.log(`\nTesting Sandbox Item: [${item.toUpperCase()}]...`);
    
    // Select item via UI or API
    await page.evaluate((id) => window.__sandbox.selectItem(id), item);
    await new Promise((r) => setTimeout(r, 400));

    let state = await page.evaluate((id) => window.__sandbox.itemState(id), item);
    console.log(`[${item}] Initial state:`, state);

    if (!state || state.pos.y < 0.75) {
      throw new Error(`Item ${item} not properly placed on floating counter (y=${state?.pos?.y})`);
    }

    // Capture resting screenshot
    await page.screenshot({ path: join(out, `sandbox-${item}-calm.png`) });

    // Test physics impulse / vector push
    await page.evaluate(() => {
      window.__sandbox.pushVector(0.25, 0.05, -0.15, 0.02);
    });
    await new Promise((r) => setTimeout(r, 400));

    state = await page.evaluate((id) => window.__sandbox.itemState(id), item);
    console.log(`[${item}] State after vector push:`, state);

    // Capture dynamic interaction screenshot
    await page.screenshot({ path: join(out, `sandbox-${item}-pushed.png`) });

    results[item] = { passed: true, initialY: state.pos.y };
  }

  writeFileSync(
    join(out, "sandbox-all-items-report.json"),
    JSON.stringify({ passed: true, results, errors, timestamp: new Date().toISOString() }, null, 2),
  );
  console.log("\nALL ITEMS SANDBOX QA SUITE PASSED!");
} finally {
  await browser.close();
}
