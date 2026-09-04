import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "..", ".tmp-paper-test");
mkdirSync(out, { recursive: true });

const CHROME =
  process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

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
await page.goto(`http://127.0.0.1:5173/?sandbox=1`, { waitUntil: "networkidle0" });
await page.waitForFunction(() => window.__sandbox);
await new Promise((r) => setTimeout(r, 600));

await page.screenshot({ path: join(out, "sandbox-with-reset-buttons.png") });
console.log("Saved sandbox-with-reset-buttons.png");

await browser.close();
