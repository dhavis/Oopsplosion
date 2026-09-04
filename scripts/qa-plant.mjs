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
console.log(`Testing Multi-Component Plant Physics on ${origin}...`);

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

  console.log("1. Selecting Plant in Sandbox...");
  await page.evaluate(() => window.__sandbox.selectItem("plant"));
  await new Promise((r) => setTimeout(r, 400));

  let state = await page.evaluate(() => window.__sandbox.itemState("plant"));
  console.log("Initial resting plant state:", state);

  if (state.potState !== "intact" || state.soilState !== "contained" || state.foliageState !== "rooted") {
    throw new Error(`Invalid initial plant state: ${JSON.stringify(state)}`);
  }
  await page.screenshot({ path: join(out, "sandbox-plant-resting.png") });

  console.log("2. Testing Foliage Sway on Crown Poke...");
  const canvasBox = await page.$eval("#room", (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.38 }; // upper region = foliage
  });

  await page.mouse.move(canvasBox.x, canvasBox.y);
  await page.mouse.down();
  await page.mouse.move(canvasBox.x + 40, canvasBox.y - 10, { steps: 3 });
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 300));

  state = await page.evaluate(() => window.__sandbox.itemState("plant"));
  console.log("State after foliage poke/sway:", state);
  await page.screenshot({ path: join(out, "sandbox-plant-foliage-sway.png") });

  console.log("3. Testing Soil Spill on Heavy Tilt/Tip...");
  await page.evaluate(() => {
    window.__sandbox.pushVector(0.4, 0.05, 0.1, 0.12); // Push near top of pot to tip
  });
  await new Promise((r) => setTimeout(r, 600));

  state = await page.evaluate(() => window.__sandbox.itemState("plant"));
  console.log("State after tip/spill:", state);
  await page.screenshot({ path: join(out, "sandbox-plant-spilling.png") });

  console.log("4. Testing Ceramic Pot Shatter & Soil Scatter on Hard Floor Drop...");
  await page.evaluate(() => {
    window.__sandbox.shatterFloor();
  });
  await new Promise((r) => setTimeout(r, 800));

  state = await page.evaluate(() => window.__sandbox.itemState("plant"));
  console.log("State after shatter:", state);

  if (!state.isBroken || state.potState !== "shattered") {
    throw new Error(`Plant pot did not shatter on hard floor impact! State: ${JSON.stringify(state)}`);
  }
  await page.screenshot({ path: join(out, "sandbox-plant-shattered.png") });

  console.log("5. Testing Reset Functionality...");
  await page.evaluate(() => window.__sandbox.reset());
  await new Promise((r) => setTimeout(r, 400));

  state = await page.evaluate(() => window.__sandbox.itemState("plant"));
  console.log("State after reset:", state);

  if (state.potState !== "intact" || state.isBroken) {
    throw new Error(`Plant reset failed: ${JSON.stringify(state)}`);
  }

  writeFileSync(
    join(out, "qa-plant-report.json"),
    JSON.stringify({ passed: true, finalState: state, errors, timestamp: new Date().toISOString() }, null, 2),
  );

  console.log("\nMULTI-COMPONENT PLANT QA SUITE PASSED!");
} finally {
  await browser.close();
}
