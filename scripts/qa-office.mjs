import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MUST_PASS, PHONE_ASPECT, SOAK } from "./form-factors.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "..", ".tmp-paper-test");
mkdirSync(out, { recursive: true });

const FULL = process.argv.includes("--full");
const CHROME =
  process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function findOrigin() {
  for (const port of [5174, 5173, 5175]) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.ok) return `http://127.0.0.1:${port}`;
    } catch {
      /* try next */
    }
  }
  throw new Error("No Vite server on 5174/5173/5175. Start: npx vite --host --port 5174");
}

function seated(p, label) {
  const fails = [];
  if (p.y < 0.4) fails.push(`${label} on floor/void (y=${p.y.toFixed(2)})`);
  if (p.y > 2.0) fails.push(`${label} exploded (y=${p.y.toFixed(2)})`);
  if (p.x < 0.05 || p.x > 2.75) fails.push(`${label} off room X (x=${p.x.toFixed(2)})`);
  if (p.z < -0.1 || p.z > 2.4) fails.push(`${label} off room Z (z=${p.z.toFixed(2)})`);
  return fails;
}

const origin = await findOrigin();
const report = { origin, full: FULL, cases: [], errors: [] };

const AUTHOR = MUST_PASS.find((v) => v.id === "C");
if (!AUTHOR) throw new Error("missing viewport C");

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [`--window-size=${AUTHOR.w + 30},${AUTHOR.h + 60}`],
  defaultViewport: {
    width: AUTHOR.w,
    height: AUTHOR.h,
    deviceScaleFactor: Math.min(2, AUTHOR.dpr),
    isMobile: true,
    hasTouch: true,
  },
});

const page = await browser.newPage();
page.on("pageerror", (e) => report.errors.push(`PAGEERROR ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") report.errors.push(`CONS ${m.text()}`);
});

const hideChrome =
  "#test-panel, #test-toggle, #chrome .boot, #chrome .title-block, #chrome .constraint { display:none !important; }";

async function loadFresh() {
  await page.goto(`${origin}/?test=1`, { waitUntil: "networkidle0", timeout: 25000 });
  await page.waitForFunction(() => window.__oops, { timeout: 15000 });
  await page.addStyleTag({ content: hideChrome });
}

async function dump() {
  return page.evaluate(() => ({
    events: window.__oops.events(),
    papers: window.__oops.papers(),
    mouths: window.__oops.mouths(),
    cup: window.__oops.cup(),
    jam: window.__oops.body("jam"),
    lamp: window.__oops.body("lamp"),
    phone: window.__oops.body("phone"),
  }));
}

function record(id, pass, detail) {
  report.cases.push({ id, pass, detail });
}

async function measureCover(page) {
  return page.evaluate((phoneAspect) => {
    const field = document.querySelector("#playfield");
    if (!field) return { error: "missing #playfield" };
    const r = field.getBoundingClientRect();
    const aspect = r.width / r.height;
    return {
      vw: window.innerWidth,
      vh: window.innerHeight,
      w: Math.round(r.width),
      h: Math.round(r.height),
      aspect,
      drift: Math.abs(aspect - phoneAspect),
      contained: r.width <= window.innerWidth + 1 && r.height <= window.innerHeight + 1,
    };
  }, PHONE_ASPECT);
}

async function setPhone(page, spec) {
  await page.setViewport({
    width: spec.w,
    height: spec.h,
    deviceScaleFactor: Math.min(3, spec.dpr),
    isMobile: true,
    hasTouch: true,
  });
  await page.evaluate(() => window.dispatchEvent(new Event("resize")));
  await new Promise((r) => setTimeout(r, 80));
}

try {
  await loadFresh();
  await new Promise((r) => setTimeout(r, 1500));
  const canvas = await page.$("#room");
  if (!canvas) throw new Error("#room canvas missing");
  await canvas.screenshot({ path: join(out, "qa-calm.png") });
  const calm = await dump();
  record("F1", calm.events.length === 0 && calm.papers.length === 0, {
    events: calm.events,
    n: calm.papers.length,
  });
  record("F2", seated(calm.cup, "cup").length === 0, {
    cup: calm.cup,
    jam: calm.jam,
    lamp: calm.lamp,
    phone: calm.phone,
    notes: [...seated(calm.jam, "jam"), ...seated(calm.lamp, "lamp"), ...seated(calm.phone, "phone")],
  });

  const coverIds = FULL ? [...MUST_PASS, ...SOAK] : MUST_PASS;
  for (const spec of coverIds) {
    await setPhone(page, spec);
    const cover = await measureCover(page);
    const pass =
      !cover.error && cover.contained && cover.drift < 0.012 && cover.w >= spec.w * 0.96;
    record(`APP-02-${spec.id}`, pass, { spec, cover });
    if (["A", "C", "F"].includes(spec.id) || FULL) {
      const shot = (await page.$("#playfield")) ?? canvas;
      await shot.screenshot({ path: join(out, `qa-cover-${spec.id}.png`) });
    }
  }
  await setPhone(page, AUTHOR);
  await loadFresh();
  await new Promise((r) => setTimeout(r, 600));
  const room = await page.$("#room");
  if (!room) throw new Error("#room canvas missing after cover pass");

  await page.evaluate(() => window.__oops.poke("cup"));
  await new Promise((r) => setTimeout(r, FULL ? 10000 : 2000));
  await room.screenshot({ path: join(out, "qa-coffee.png") });
  const coffee = await dump();
  const coffeeOk = coffee.events.includes("cup>printer") && coffee.papers.length >= 1;
  record("F3", coffeeOk, { events: coffee.events, n: coffee.papers.length, cup: coffee.cup });
  if (FULL) {
    record("F7", coffee.events.includes("paper>fan") && coffee.events.includes("copier-wake"), {
      events: coffee.events,
    });
  }

  for (const [id, poke, expect, wait, shot] of [
    ["F4", "jam", "jam>fan", 800, "qa-jam.png"],
    ["F5", "lamp", "lamp-poke", 800, "qa-lamp.png"],
    ["F6", "phone", "phone>cup", 800, "qa-phone.png"],
  ]) {
    await loadFresh();
    await new Promise((r) => setTimeout(r, 400));
    const c = await page.$("#room");
    await page.evaluate((label) => window.__oops.poke(label), poke);
    await new Promise((r) => setTimeout(r, wait));
    await c.screenshot({ path: join(out, shot) });
    const d = await dump();
    const hit = d.events.includes(expect) || (expect === "lamp-poke" && d.events.some((e) => e.startsWith("lamp")));
    record(id, hit, { events: d.events });
  }

  await loadFresh();
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate(() => window.__oops.poke("printer"));
  await new Promise((r) => setTimeout(r, 500));
  const lame = await dump();
  record("F8", !lame.events.includes("copier-wake") && !lame.events.includes("cup>printer"), {
    events: lame.events,
  });
} catch (err) {
  report.errors.push(String(err));
  await page.screenshot({ path: join(out, "qa-fail.png") }).catch(() => {});
} finally {
  await browser.close();
}

const failed = report.cases.filter((c) => !c.pass);
report.ok = failed.length === 0 && report.errors.filter((e) => !e.includes("404")).length === 0;
writeFileSync(join(out, "qa-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
