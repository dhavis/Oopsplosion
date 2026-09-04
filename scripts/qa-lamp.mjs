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
console.log(`Testing Multi-Component Lamp Physics on ${origin}...`);

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

  console.log("1. Selecting Lamp in Sandbox...");
  await page.evaluate(() => window.__sandbox.selectItem("lamp"));
  await new Promise((r) => setTimeout(r, 400));

  let state = await page.evaluate(() => window.__sandbox.itemState("lamp"));
  console.log("Initial resting lamp state:", state);

  if (state.bulbState !== "intact" || state.powerState !== "on" || state.isBroken) {
    throw new Error(`Invalid initial lamp state: ${JSON.stringify(state)}`);
  }
  await page.screenshot({ path: join(out, "sandbox-lamp-resting.png") });

  console.log("2. Testing Shade Sway / Vector Push...");
  await page.evaluate(() => {
    window.__sandbox.pushVector(0.35, 0.05, -0.2, 0.04);
  });
  await new Promise((r) => setTimeout(r, 300));
  state = await page.evaluate(() => window.__sandbox.itemState("lamp"));
  console.log("Lamp state after shade push:", state);
  if (state.isBroken || state.bulbState !== "intact") {
    throw new Error("Lamp bulb broke prematurely on gentle push!");
  }
  await page.screenshot({ path: join(out, "sandbox-lamp-swaying.png") });

  console.log("3. Testing Light Bulb Shatter on Hard Impact...");
  await page.evaluate(() => window.__sandbox.shatterFloor());
  await new Promise((r) => setTimeout(r, 600));

  state = await page.evaluate(() => window.__sandbox.itemState("lamp"));
  console.log("Lamp state after hard floor drop:", state);
  if (state.bulbState !== "burst" || !state.isBroken) {
    throw new Error("Lamp bulb did not burst on hard impact!");
  }
  await page.screenshot({ path: join(out, "sandbox-lamp-burst.png") });

  console.log("4. Testing Sandbox Reset...");
  await page.evaluate(() => window.__sandbox.reset());
  await new Promise((r) => setTimeout(r, 400));
  state = await page.evaluate(() => window.__sandbox.itemState("lamp"));
  console.log("Lamp state after reset:", state);
  if (state.bulbState !== "intact" || state.isBroken) {
    throw new Error("Lamp did not reset properly!");
  }
  await page.screenshot({ path: join(out, "sandbox-lamp-reset.png") });

  console.log("5. Testing Office World with Lamp Assembly...");
  await page.goto(`${origin}/`, { waitUntil: "networkidle0", timeout: 20000 });
  await page.waitForFunction(() => window.__oops, { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 500));

  const officeSnapshot = await page.evaluate(() => window.__oops.lamp());
  console.log("Office World Lamp Assembly Snapshot:", officeSnapshot);

  if (!officeSnapshot.pos || officeSnapshot.cordCount < 5 || officeSnapshot.isBroken) {
    throw new Error(`Invalid Office lamp assembly state: ${JSON.stringify(officeSnapshot)}`);
  }
  await page.screenshot({ path: join(out, "office-lamp-assembly.png") });

  console.log("\n--- ALL MULTI-COMPONENT LAMP PHYSICS TESTS PASSED! ---");
} finally {
  await browser.close();
  if (errors.length > 0) {
    console.error("Errors encountered during test:", errors);
  }
}
