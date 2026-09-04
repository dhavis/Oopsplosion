export type TestAction = "clicks" | "coffee" | "jam" | "lamp" | "phone";

export const TEST_OBJECTS = [
  { id: "cup", name: "Coffee cup", role: "Fuse A" },
  { id: "jam", name: "Jam sheet", role: "Fuse B" },
  { id: "lamp", name: "Lamp", role: "Fuse C" },
  { id: "phone", name: "Phone", role: "Fuse D" },
  { id: "printer", name: "Printer", role: "Annoyance" },
  { id: "fan", name: "Fan", role: "Engine" },
  { id: "chair", name: "Chair", role: "Vent / chain" },
  { id: "plant", name: "Plant", role: "Vent" },
  { id: "bag", name: "Bag", role: "Vent" },
  { id: "copier", name: "Copier", role: "Punchline" },
] as const;

export const TEST_SCRIPTS: Record<
  TestAction,
  { title: string; poke: string | null; expect: string[]; hint: string }
> = {
  clicks: {
    title: "Click check",
    poke: null,
    expect: [],
    hint: "Poke every object in the list. All ten must register a hit.",
  },
  coffee: {
    title: "Coffee chain",
    poke: "cup",
    expect: ["cup>printer", "paper>fan", "paper>lamp", "lamp>chair", "chair>copier", "copier-wake"],
    hint: "Cup into printer. Paper to fan, lamp drops, chair wakes copier.",
  },
  jam: {
    title: "Jam yank",
    poke: "jam",
    expect: ["jam>fan", "paper>lamp", "lamp>chair", "chair>copier", "copier-wake"],
    hint: "Yank the jam into the fan. Skip the wet printer death.",
  },
  lamp: {
    title: "Lamp drop",
    poke: "lamp",
    expect: ["lamp>chair", "chair>copier", "copier-wake"],
    hint: "Lamp into chair into copier. No paper storm.",
  },
  phone: {
    title: "Phone walk",
    poke: "phone",
    expect: ["phone>cup", "phone>copier", "copier-wake"],
    hint: "Phone walks the cup, then hydroplanes onto the copier.",
  },
};

export function normalizeEvent(ev: string) {
  if (/^paper\d*>fan$/.test(ev)) return "paper>fan";
  return ev;
}

export type TestApi = {
  probe: (id: string) => string;
  reset: () => void;
  skipToPlay: () => void;
};

export class TestLayer {
  enabled = false;
  action: TestAction = "coffee";
  private root: HTMLElement;
  private api: TestApi;
  private hits = new Map<string, string>();
  private log: string[] = [];
  private runUntil = 0;
  private runActive = false;

  constructor(api: TestApi) {
    this.api = api;
    this.root = document.createElement("aside");
    this.root.id = "test-panel";
    this.root.className = "hidden";
    document.body.appendChild(this.root);
    this.mountToggle();
    this.render();
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    this.root.classList.toggle("hidden", !on);
    document.getElementById("test-toggle")?.classList.toggle("on", on);
    this.render();
  }

  notifyHit(label: string, note: string) {
    this.hits.set(label, note);
    this.render();
  }

  notifyChain(events: string[]) {
    this.log = events.map(normalizeEvent);
    if (this.runActive && this.allExpectedMet()) this.runActive = false;
    this.render();
  }

  resetTracking() {
    this.hits.clear();
    this.log = [];
    this.runActive = false;
    this.runUntil = 0;
    this.render();
  }

  skipCard() {
    return this.enabled;
  }

  tick(now: number) {
    if (this.runActive && now > this.runUntil) {
      this.runActive = false;
      this.render();
    }
  }

  private mountToggle() {
    const btn = document.createElement("button");
    btn.id = "test-toggle";
    btn.type = "button";
    btn.className = "hidden";
    btn.textContent = "TEST";
    btn.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.setEnabled(!this.enabled);
    });
    (document.getElementById("playfield") ?? document.getElementById("stage"))?.appendChild(btn);
  }

  private allExpectedMet() {
    const expect = TEST_SCRIPTS[this.action].expect;
    const have = new Set(this.log);
    return expect.every((e) => have.has(e));
  }

  private render() {
    const script = TEST_SCRIPTS[this.action];
    const have = new Set(this.log);
    const clickPass = TEST_OBJECTS.every((o) => this.hits.has(o.id));
    const chainRows = script.expect
      .map((e) => {
        const ok = have.has(e);
        return `<li class="${ok ? "pass" : this.runActive ? "wait" : "fail"}">${ok ? "PASS" : this.runActive ? "…" : "MISS"} ${e}</li>`;
      })
      .join("");
    const extra = this.log.filter((e) => !script.expect.includes(e));
    const objRows = TEST_OBJECTS.map((o) => {
      const note = this.hits.get(o.id);
      return `<button type="button" class="obj ${note ? "hit" : ""}" data-probe="${o.id}">
        <span>${o.name}</span>
        <em>${note ? note : o.role}</em>
      </button>`;
    }).join("");

    let verdict = "Pick an action, poke or Run.";
    if (this.action === "clicks") {
      verdict = clickPass
        ? "PASS — all ten objects registered a click."
        : `${this.hits.size}/10 objects clicked.`;
    } else if (script.expect.length) {
      const n = script.expect.filter((e) => have.has(e)).length;
      if (n === script.expect.length) verdict = "PASS — expected chain fired.";
      else if (this.runActive) verdict = `Running… ${n}/${script.expect.length} links.`;
      else if (this.log.length || this.hits.size) verdict = `FAIL — ${n}/${script.expect.length} expected links.`;
    }

    this.root.innerHTML = `
      <header>
        <strong>Office test</strong>
        <span class="verdict ${verdict.startsWith("PASS") ? "pass" : verdict.startsWith("FAIL") ? "fail" : ""}">${verdict}</span>
      </header>
      <label>Action
        <select id="test-action">
          ${Object.entries(TEST_SCRIPTS)
            .map(
              ([k, v]) =>
                `<option value="${k}" ${k === this.action ? "selected" : ""}>${v.title}</option>`,
            )
            .join("")}
        </select>
      </label>
      <p class="hint">${script.hint}</p>
      <div class="row">
        <button type="button" id="test-run" ${script.poke ? "" : "disabled"}>Run chain</button>
        <button type="button" id="test-clear">Clear log</button>
      </div>
      ${script.expect.length ? `<ul class="expect">${chainRows}</ul>` : ""}
      ${extra.length ? `<p class="extra">Also fired: ${extra.join(", ")}</p>` : ""}
      <h3>Objects — tap to poke</h3>
      <div class="objs">${objRows}</div>
    `;

    this.root.querySelector<HTMLSelectElement>("#test-action")?.addEventListener("change", (e) => {
      this.action = (e.target as HTMLSelectElement).value as TestAction;
      this.render();
    });
    this.root.querySelector("#test-run")?.addEventListener("click", () => this.run());
    this.root.querySelector("#test-clear")?.addEventListener("click", () => this.resetTracking());
    this.root.querySelectorAll<HTMLButtonElement>("[data-probe]").forEach((b) => {
      b.addEventListener("click", () => {
        const id = b.dataset.probe;
        if (!id) return;
        const note = this.api.probe(id);
        this.notifyHit(id, note);
      });
    });
  }

  private run() {
    const poke = TEST_SCRIPTS[this.action].poke;
    if (!poke) return;
    this.api.skipToPlay();
    this.resetTracking();
    this.runActive = true;
    this.runUntil = performance.now() + 12000;
    window.setTimeout(() => {
      this.api.probe(poke);
      this.render();
    }, 80);
  }
}
