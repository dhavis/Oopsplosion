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
  await page.goto(`${origin}/?sandbox=1`, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 600));

  // Capture initial clean start
  await page.screenshot({ path: "sandbox-clean-start.png" });

  const items = ["cup", "phone", "fan", "plant", "printer", "lamp", "chair", "bag"];

  for (const item of items) {
    console.log(`Capturing sandbox item: ${item}...`);
    await page.evaluate((id) => {
      window.__sandbox.selectItem(id);
    }, item);
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: `sandbox-${item}.png` });
  }

  await browser.close();
  console.log("All screenshots captured successfully!");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
