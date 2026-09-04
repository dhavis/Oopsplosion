import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
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
console.log(`Testing Multi-Component Bag Physics on ${origin}...`);

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

try {
  await page.goto(`${origin}/?sandbox=1`, { waitUntil: "networkidle0", timeout: 20000 });
  await page.waitForFunction(() => window.__sandbox, { timeout: 10000 });

  console.log("1. Selecting Bag in Sandbox...");
  await page.evaluate(() => window.__sandbox.selectItem("bag"));
  await new Promise((r) => setTimeout(r, 400));

  let state = await page.evaluate(() => window.__sandbox.itemState("bag"));
  console.log("Initial resting bag state:", state);

  if (state.mouthState !== "ajar" || state.spillState !== "contained" || state.containedCount !== 6 || state.isBroken) {
    throw new Error(`Invalid initial bag state: ${JSON.stringify(state)}`);
  }
  await page.screenshot({ path: join(out, "sandbox-bag-resting.png") });

  console.log("2. Testing Bag Flex / Vector Push...");
  await page.evaluate(() => {
    window.__sandbox.pushVector(0.35, 0.05, -0.2, 0.04);
  });
  await new Promise((r) => setTimeout(r, 300));
  state = await page.evaluate(() => window.__sandbox.itemState("bag"));
  console.log("Bag state after panel push:", state);
  if (state.isBroken || state.spillState === "spilled") {
    throw new Error("Bag spilled prematurely on gentle push!");
  }

  console.log("3. Testing Drop / Shatter Floor & Payload Spill...");
  await page.evaluate(() => window.__sandbox.shatterFloor());
  await new Promise((r) => setTimeout(r, 800));

  state = await page.evaluate(() => window.__sandbox.itemState("bag"));
  console.log("Bag state after hard floor drop:", state);

  if (state.spillState !== "spilled" || !state.isBroken || state.containedCount > 0) {
    throw new Error(`Bag payload did not spill on hard impact! State: ${JSON.stringify(state)}`);
  }
  await page.screenshot({ path: join(out, "sandbox-bag-spilled.png") });

  console.log("4. Testing Sandbox Reset...");
  await page.evaluate(() => window.__sandbox.reset());
  await new Promise((r) => setTimeout(r, 400));
  state = await page.evaluate(() => window.__sandbox.itemState("bag"));
  console.log("Bag state after reset:", state);
  if (state.spillState !== "contained" || state.containedCount !== 6 || state.isBroken) {
    throw new Error(`Bag did not reset properly! State: ${JSON.stringify(state)}`);
  }

  console.log("5. Testing Office World Bag Assembly Integration...");
  await page.goto(`${origin}/`, { waitUntil: "networkidle0", timeout: 20000 });
  await page.waitForFunction(() => window.__oops, { timeout: 10000 });

  const officeBag = await page.evaluate(() => window.__oops.bag());
  console.log("Office Bag initial state:", officeBag);

  if (!officeBag.pos || officeBag.containedCount !== 6 || officeBag.isBroken) {
    throw new Error(`Invalid office world bag state: ${JSON.stringify(officeBag)}`);
  }
  await page.screenshot({ path: join(out, "office-bag-initial.png") });

  console.log("ALL BAG PHYSICS QA TESTS PASSED!");
} catch (e) {
  console.error("QA FAILED:", e);
  process.exitCode = 1;
} finally {
  await browser.close();
  if (errors.length > 0) {
    console.log("Encountered errors/warnings:", errors);
  }
}
