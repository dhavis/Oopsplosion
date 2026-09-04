import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

mkdirSync(".tmp-paper-test", { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--window-size=420,900"],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
});

const page = await browser.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONS", m.text());
});

try {
  await page.goto("http://localhost:5174/?test=1", { waitUntil: "networkidle0", timeout: 25000 });
  await page.waitForFunction(() => window.__oops, { timeout: 15000 });
  await page.addStyleTag({
    content:
      "#test-panel, #test-toggle, #chrome .boot, #chrome .title-block, #chrome .constraint { display:none !important; }",
  });
  await new Promise((r) => setTimeout(r, 1500));
  const canvas = await page.$("#room");
  await canvas.screenshot({ path: ".tmp-paper-test/room3d.png" });
  console.log(
    "calm",
    await page.evaluate(() => ({
      n: window.__oops.papers().length,
      events: window.__oops.events(),
      cup: window.__oops.cup(),
    })),
  );
  await page.evaluate(() => window.__oops.poke("cup"));
  await new Promise((r) => setTimeout(r, 500));
  await canvas.screenshot({ path: ".tmp-paper-test/room3d-poke.png" });
  console.log(
    "poke",
    await page.evaluate(() => ({
      n: window.__oops.papers().length,
      events: window.__oops.events(),
      cup: window.__oops.cup(),
    })),
  );
} catch (err) {
  console.error(String(err));
  await page.screenshot({ path: ".tmp-paper-test/room3d-fail.png" });
} finally {
  await browser.close();
}
