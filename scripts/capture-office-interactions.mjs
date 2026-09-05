import puppeteer from "puppeteer-core";

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

async function run() {
  const origin = await findOrigin();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--window-size=1080,1080", "--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: {
      width: 1080,
      height: 1080,
      deviceScaleFactor: 2,
    },
  });

  const page = await browser.newPage();
  await page.goto(`${origin}/?test=1`, { waitUntil: "networkidle0" });
  await page.waitForFunction(() => window.__oops, { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 600));

  // Capture calm office
  await page.screenshot({ path: "office-unified-calm.png" });

  // Simulate dragging the coffee cup
  const canvas = await page.$("#room");
  const box = await canvas.boundingBox();

  // Cup is around center-right (approx 0.45 * width, 0.58 * height)
  const cupX = box.x + box.width * 0.46;
  const cupY = box.y + box.height * 0.58;

  await page.mouse.move(cupX, cupY);
  await page.mouse.down();
  await page.mouse.move(cupX + 80, cupY - 120, { steps: 10 });
  await new Promise((r) => setTimeout(r, 200));
  await page.screenshot({ path: "office-drag-cup.png" });
  await page.mouse.up();

  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: "office-after-cup-interaction.png" });

  await browser.close();
  console.log("Office interaction screenshots captured!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
