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
console.log(`Testing Electrical Blackout & Surge Sequence on ${origin}...`);

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
  await page.goto(`${origin}/?test=1`, { waitUntil: "networkidle0", timeout: 20000 });
  await page.waitForFunction(() => window.__oops, { timeout: 10000 });

  // 1. Initial calm state before pouring
  await page.screenshot({ path: join(out, "office-calm-before-spill.png") });
  console.log("Saved office-calm-before-spill.png");

  // 2. Trigger coffee cup poke / tip into printer
  console.log("Triggering coffee tip into printer...");
  await page.evaluate(() => {
    window.__oops.poke("cup");
  });

  // Wait for liquid dripping & electric short (printer goes feral while power is on)
  await page.waitForFunction(() => window.__oops.events().includes("wet>short"), { timeout: 5000 });
  await page.screenshot({ path: join(out, "office-liquid-dripping.png") });
  console.log("Saved office-liquid-dripping.png");

  // Wait for lamp electrical surge & bulb burst
  await page.waitForFunction(() => window.__oops.events().includes("lamp>burst"), { timeout: 8000 });
  await page.screenshot({ path: join(out, "office-lamp-bulb-burst.png") });
  console.log("Saved office-lamp-bulb-burst.png");

  // Wait for final breaker pop & full blackout
  await page.waitForFunction(() => window.__oops.events().includes("blackout"), { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 600)); // allow blackout lerp
  await page.screenshot({ path: join(out, "office-blackout-breaker-trip.png") });
  console.log("Saved office-blackout-breaker-trip.png");

  const blackoutReport = await page.evaluate(() => {
    const events = window.__oops.events();
    const pwr = window.__oops.power();
    return {
      events,
      hasCupPrinter: events.includes("cup>printer"),
      hasWetShort: events.includes("wet>short"),
      hasSurgeLamp: events.includes("surge>lamp"),
      hasLampBurst: events.includes("lamp>burst"),
      hasBlackout: events.includes("blackout"),
      powerState: pwr,
    };
  });

  console.log("Blackout chain events & power report:", blackoutReport);
  if (!blackoutReport.hasCupPrinter || !blackoutReport.hasWetShort || !blackoutReport.hasLampBurst || !blackoutReport.hasBlackout) {
    throw new Error("Expected cup>printer, wet>short, lamp>burst, and blackout in chain events!");
  }

  writeFileSync(
    join(out, "blackout-report.json"),
    JSON.stringify({ passed: true, blackoutReport, errors, timestamp: new Date().toISOString() }, null, 2),
  );
  console.log("\nBLACKOUT & ELECTRICAL SURGE QA TEST PASSED!");
} finally {
  await browser.close();
}
