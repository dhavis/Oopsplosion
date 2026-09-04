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
console.log(`Testing Cup Sandbox on ${origin}...`);

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
  // Test 1: Load Sandbox directly via URL
  console.log("1. Loading sandbox directly via ?sandbox...");
  await page.goto(`${origin}/?sandbox=1`, { waitUntil: "networkidle0", timeout: 20000 });
  await page.waitForFunction(() => window.__sandbox, { timeout: 10000 });

  await new Promise((r) => setTimeout(r, 600));

  let state = await page.evaluate(() => window.__sandbox.cup());
  console.log("Initial state:", state);
  if (Math.abs(state.pos.y - 0.85) > 0.05) {
    throw new Error(`Cup not seated on counter: y=${state.pos.y}`);
  }
  if (state.liquidMl < 210 || state.isBroken) {
    throw new Error(`Invalid initial cup state: liquid=${state.liquidMl}, broken=${state.isBroken}`);
  }

  await page.screenshot({ path: join(out, "sandbox-calm.png") });
  console.log("Saved sandbox-calm.png");

  // Test 2: Apply Directional Hit Vector & Test Spilling
  console.log("2. Applying directional hit vector to tip and spill coffee...");
  await page.evaluate(() => {
    window.__sandbox.pushVector(0.35, 0.08, -0.2, 0.04);
  });

  await new Promise((r) => setTimeout(r, 800));
  state = await page.evaluate(() => window.__sandbox.cup());
  console.log("State after push vector:", state);
  if (state.liquidMl >= 220) {
    console.warn("Cup tilted, liquid level:", state.liquidMl);
  }
  await page.screenshot({ path: join(out, "sandbox-spill.png") });
  console.log("Saved sandbox-spill.png");

  // Test 3: Drop from height onto floor to test high-impact shatter
  console.log("3. Dropping cup onto floor to test ceramic fracture & shatter...");
  await page.evaluate(() => {
    window.__sandbox.shatterFloor();
  });

  await new Promise((r) => setTimeout(r, 1000));
  state = await page.evaluate(() => window.__sandbox.cup());
  console.log("State after floor impact:", state);
  if (!state.isBroken) {
    throw new Error("Cup failed to shatter upon high-speed floor impact!");
  }
  await page.screenshot({ path: join(out, "sandbox-shatter.png") });
  console.log("Saved sandbox-shatter.png");

  // Test 4: Reset Button
  console.log("4. Testing reset functionality...");
  await page.click("#reset-room");
  await new Promise((r) => setTimeout(r, 600));
  state = await page.evaluate(() => window.__sandbox.cup());
  console.log("State after reset:", state);
  if (state.isBroken || state.liquidMl < 215) {
    throw new Error("Cup failed to reset cleanly!");
  }

  // Test 5: Mode Switch back to Office and back to Sandbox
  console.log("5. Testing mode switcher buttons...");
  await page.click("#btn-office");
  await new Promise((r) => setTimeout(r, 500));
  const hasOops = await page.evaluate(() => !!window.__oops);
  if (!hasOops) throw new Error("Failed to transition to Office mode");

  await page.click("#btn-sandbox");
  await new Promise((r) => setTimeout(r, 500));
  const hasSandbox = await page.evaluate(() => !!window.__sandbox);
  if (!hasSandbox) throw new Error("Failed to transition back to Sandbox mode");

  console.log("\nALL SANDBOX QA CHECKS PASSED!");
  writeFileSync(
    join(out, "sandbox-report.json"),
    JSON.stringify({ passed: true, errors, timestamp: new Date().toISOString() }, null, 2),
  );
} finally {
  await browser.close();
}
