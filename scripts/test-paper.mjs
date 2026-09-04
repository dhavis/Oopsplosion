import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "..", ".tmp-paper-test");
mkdirSync(out, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--window-size=420,900"],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
});

const page = await browser.newPage();
page.setDefaultTimeout(20000);
await page.goto("http://localhost:5173/?test=1", { waitUntil: "networkidle0" });
await page.waitForFunction(() => window.__oops);
await page.addStyleTag({
  content: "#test-panel, #test-toggle { display: none !important; }",
});

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

await page.evaluate(() => window.__oops.poke("cup"));

const canvas = await page.$("#room");
let prev = [];
const bornFar = [];

for (let t = 0; t <= 9000; t += 100) {
  await new Promise((r) => setTimeout(r, 100));
  const { papers, mouths, events } = await page.evaluate(() => ({
    papers: window.__oops.papers(),
    mouths: window.__oops.mouths(),
    events: window.__oops.events(),
  }));
  for (const p of papers) {
    const moved = prev.some((q) => dist(p, q) < 22);
    if (!moved && prev.length) {
      const d = Math.min(dist(p, mouths.printer), dist(p, mouths.copier));
      if (d > 36) bornFar.push({ t, d: Math.round(d), p, events: events.slice() });
    }
  }
  prev = papers;
  if (t === 100 || t === 900 || t === 1900 || t === 3700 || t === 5800 || t === 8000) {
    await canvas.screenshot({ path: join(out, `t${String(t).padStart(4, "0")}.png`) });
  }
}

const final = await page.evaluate(() => ({
  events: window.__oops.events(),
  n: window.__oops.papers().length,
  mouths: window.__oops.mouths(),
}));
await canvas.screenshot({ path: join(out, "final.png") });
await browser.close();

console.log(
  JSON.stringify(
    { final, bornFar: bornFar.slice(0, 8), bornFarCount: bornFar.length },
    null,
    2,
  ),
);
if (!final.events.includes("paper>fan") || !final.events.includes("copier-wake")) {
  process.exit(1);
}
