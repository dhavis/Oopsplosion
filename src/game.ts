import * as THREE from "three";
import * as CANNON from "cannon-es";
import { Foley } from "./audio";
import { Chain } from "./chain";
import { pixelRatio } from "./formFactors";
import { pokeHaptic } from "./haptic";
import { TestLayer } from "./testLayer";
import { Chrome } from "./ui";
import { OfficeWorld, type ObjLabel } from "./world";
import { CupInteraction } from "./sandbox/CupInteraction";
import { POS, SIZE } from "./scale";

type Phase = "boot" | "title" | "constraint" | "play" | "card";

export class Game {
  private canvas: HTMLCanvasElement;
  private chrome: Chrome;
  private audio = new Foley();
  private world!: OfficeWorld;
  private interaction!: CupInteraction;
  private chain = new Chain();
  private phase: Phase = "boot";
  private phaseAt = 0;
  private playerHits = new Set<string>();
  private extraWrecks = new Set<string>();
  private fuse: string | null = null;
  private moved = new Set<string>();
  private cardShown = false;
  private lastHit = 0;
  private cupPokeAt = 0;
  private running = true;
  private worldBorn = 0;
  private resetBtn: HTMLButtonElement | null;
  private test: TestLayer;
  private lastFrame = performance.now();

  constructor(canvas: HTMLCanvasElement, chromeRoot: HTMLElement) {
    this.canvas = canvas;
    this.chrome = new Chrome(chromeRoot);
    this.resetBtn = document.querySelector<HTMLButtonElement>("#reset-room");
    this.resetWorld();
    this.bind();
    this.test = new TestLayer({
      probe: (id) => this.probe(id),
      reset: () => this.again(),
      skipToPlay: () => this.skipToPlay(),
    });
    this.enter("boot");
    if (new URLSearchParams(location.search).has("test")) {
      this.test.setEnabled(true);
      this.skipToPlay();
    }
    const bodyOf = (id: string) => {
      const c = this.world.get(id as ObjLabel);
      return { ...c.position, vx: c.velocity.x, vy: c.velocity.y, vz: c.velocity.z };
    };
    (window as unknown as { __oops: object }).__oops = {
      poke: (id: string) => this.probe(id),
      papers: () => this.world.papers.map((p) => ({ ...p.position })),
      mouths: () => ({
        printer: this.world.printerMouth(),
        copier: this.world.copierMouth(),
      }),
      events: () => this.chain.events.slice(),
      body: bodyOf,
      cup: () => bodyOf("cup"),
      cupState: () => ({
        pos: { ...this.world.cupBody?.mesh.position },
        vel: { ...this.world.cupBody?.body.velocity },
        liquidMl: this.world.cupBody?.liquidMl ?? (this.world.cupEmpty ? 0 : 220),
        isBroken: this.world.cupBody?.isBroken ?? false,
        tiltDeg: this.world.cupBody?.getTiltAngleDeg() ?? 0,
      }),
      screen: (id: string) => this.world.screen(id as ObjLabel),
      aabb: (id: string) => this.world.meshAabb(id as ObjLabel),
      dist: (a: string, b: string) =>
        this.world.dist(this.world.get(a as ObjLabel), this.world.get(b as ObjLabel)),
      lamp: () => ({
        pos: { ...this.world.lampAssembly?.shadeBody.position },
        vel: { ...this.world.lampAssembly?.shadeBody.velocity },
        bulbPos: { ...this.world.lampAssembly?.bulbBody.position },
        cordCount: this.world.lampAssembly?.cordBodies.length ?? 0,
        bulbState: this.world.lampAssembly?.bulbState,
        powerState: this.world.lampAssembly?.powerState,
        isBroken: this.world.lampAssembly?.isBroken ?? false,
      }),
      bag: () => ({
        pos: { ...this.world.bagAssembly?.baseBody.position },
        vel: { ...this.world.bagAssembly?.baseBody.velocity },
        mouthState: this.world.bagAssembly?.mouthState,
        spillState: this.world.bagAssembly?.spillState,
        containedCount: this.world.bagAssembly?.payloads.filter((p) => p.isContained).length ?? 0,
        isBroken: this.world.bagAssembly?.isBroken ?? false,
      }),
      power: () => ({
        breakerPopped: this.world.breakerPopped,
        blackout: this.world.blackout,
        fanSpin: this.world.fanSpin,
        lampBurst: this.world.lampBurst,
        lampSurging: this.world.lampSurging,
      }),
    };
    requestAnimationFrame(this.frame);
  }

  private resetWorld() {
    this.interaction?.destroy();
    this.world?.destroy();
    this.world = new OfficeWorld(this.canvas);
    this.layout();
    this.chain = new Chain();
    this.playerHits.clear();
    this.extraWrecks.clear();
    this.moved.clear();
    this.fuse = null;
    this.cardShown = false;
    this.lastHit = 0;
    this.cupPokeAt = 0;
    this.worldBorn = performance.now();

    this.interaction = new CupInteraction(
      this.world.camera,
      this.canvas,
      this.world.scene,
      {
        minX: 0.05,
        maxX: 2.75,
        minY: 0.02,
        maxY: 2.15,
        minZ: -0.10,
        maxZ: 2.30,
        counterY: SIZE.desk.h,
        counterMinX: POS.desk.x - SIZE.desk.w / 2,
        counterMaxX: POS.desk.x + SIZE.desk.w / 2,
        counterMinZ: POS.desk.z - SIZE.desk.d / 2,
        counterMaxZ: POS.desk.z + SIZE.desk.d / 2,
      },
    );

    this.interaction.onHitAction = (action, _force, target, hitLabel) => {
      const label = (hitLabel ?? target.label) as ObjLabel | undefined;
      if (!label) return;

      this.playerHits.add(label);
      this.lastHit = performance.now();
      if (!this.fuse) this.fuse = label;
      else if (label !== this.fuse) this.extraWrecks.add(label);

      pokeHaptic(label === "chair" || label === "plant" ? "heavy" : "medium");

      if (action === "poke") {
        if (label === "cup") {
          this.audio.slosh();
          if (!this.cupPokeAt) this.cupPokeAt = performance.now();
          this.chain.startCoffee(this.world, performance.now());
        } else if (label === "lamp") {
          this.audio.tick();
          this.chain.startLamp(this.world, performance.now());
        } else if (label === "phone") {
          this.audio.tick();
          this.chain.startPhone(this.world, performance.now());
        } else if (label === "jam") {
          this.audio.paper();
          this.world.yankJam();
          this.chain.startJam(this.world, performance.now());
        } else if (label === "plant") {
          this.audio.plant();
        } else if (label === "bag") {
          this.audio.thud(0.8);
        } else if (label === "fan") {
          this.audio.paper();
          this.world.fanBlow();
        } else if (label === "printer") {
          this.audio.grind();
        } else if (label === "copier") {
          this.audio.thud(2);
        } else if (label === "chair") {
          this.audio.thud(1.2);
        }
      } else if (action === "flick") {
        if (label === "cup") {
          this.audio.slosh();
          if (!this.cupPokeAt) this.cupPokeAt = performance.now();
          this.chain.startCoffee(this.world, performance.now());
        } else if (label === "lamp") {
          this.audio.tick();
          this.chain.startLamp(this.world, performance.now());
        } else if (label === "phone") {
          this.audio.tick();
          this.chain.startPhone(this.world, performance.now());
        } else if (label === "jam") {
          this.audio.paper();
          this.world.yankJam();
          this.chain.startJam(this.world, performance.now());
        } else if (label === "plant") {
          this.audio.plant();
        } else if (label === "bag") {
          this.audio.thud(1.2);
        } else if (label === "fan") {
          this.audio.paper();
          this.world.fanBlow();
        } else if (label === "chair") {
          this.audio.thud(1.5);
        }
      } else if (action === "release") {
        if (label === "cup") {
          this.audio.slosh();
        } else if (label === "plant") {
          this.audio.plant();
        } else if (label === "chair") {
          this.audio.thud(0.6);
        }
      }

      this.test?.notifyHit(label, action);
    };

    this.world.onCoffeePour = () => this.audio.slosh();
    this.world.onShortCircuit = () => {
      this.chain.link("wet>short");
      this.audio.grind();
      this.audio.surgeRise();
      this.world.startLampSurge();
      this.noteChain();
    };
    this.world.onShatter = (_pos, speed) => this.audio.shatter(speed);
    this.world.onClatter = (_pos, speed) => this.audio.thud(speed);

    this.world.onContact((a, b) => {
      if (performance.now() - this.worldBorn < 700) return;
      const kind = this.chain.handle(this.world, a, b, performance.now());
      if (kind === "coffee") {
        this.audio.slosh();
        this.audio.grind();
      } else if (kind === "jam") this.audio.paper();
      else if (kind) this.audio.thud(1.2);
      if (kind) this.noteChain();
    });
  }

  private enter(phase: Phase) {
    this.phase = phase;
    this.phaseAt = performance.now();
    if (phase === "boot") this.chrome.boot();
    if (phase === "title") this.chrome.title();
    if (phase === "constraint") this.chrome.constraint();
    if (phase === "play") this.chrome.play();
    this.resetBtn?.classList.toggle(
      "hidden",
      phase === "boot" || phase === "title" || phase === "constraint",
    );
    document.getElementById("test-toggle")?.classList.toggle(
      "hidden",
      this.phase !== "play" || !new URLSearchParams(location.search).has("test"),
    );
  }

  private bind() {
    const c = this.canvas;
    c.addEventListener("pointerdown", (e) => {
      this.audio.resume();
      if (this.phase === "boot") {
        this.enter("title");
        return;
      }
      if (this.phase === "title") {
        this.enter("constraint");
        return;
      }
      if (this.phase === "constraint") {
        this.enter("play");
        return;
      }
      if (this.phase === "play" || this.phase === "card") {
        const target = this.world.pickInteractiveTarget(e.clientX, e.clientY);
        if (!target) {
          this.showMiss();
        } else {
          this.interaction.onPointerDown(
            e.clientX,
            e.clientY,
            e.pointerId,
            target,
          );
          c.setPointerCapture(e.pointerId);
        }
      }
    });
    c.addEventListener("pointermove", (e) => {
      if (this.phase === "play" || this.phase === "card") {
        this.interaction.onPointerMove(e.clientX, e.clientY, e.pointerId);
      }
    });
    c.addEventListener("pointerup", (e) => {
      if (this.phase === "play" || this.phase === "card") {
        this.interaction.onPointerUp(e.clientX, e.clientY, e.pointerId);
      }
    });
    c.addEventListener("pointercancel", (e) => {
      if (this.phase === "play" || this.phase === "card") {
        this.interaction.onPointerUp(e.clientX, e.clientY, e.pointerId);
      }
    });
    window.addEventListener("resize", () => this.layout());
    window.addEventListener("orientationchange", () => this.layout());
    window.visualViewport?.addEventListener("resize", () => this.layout());
    this.layout();
  }

  private showMiss() {
    this.chrome.miss();
    window.setTimeout(() => {
      if (this.phase === "play") this.chrome.play();
    }, 700);
  }

  private layout() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = pixelRatio();
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    this.world?.layout(this.canvas.width, this.canvas.height);
  }

  private frame = () => {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;

    this.advancePhase(now);

    this.interaction?.updatePhysics(dt);
    this.world.timeScale = this.chain.playing ? 0.42 : 1;
    if (!this.world.breakerPopped) {
      this.world.fanSpin = this.chain.playing || this.chain.paperFan ? 28 : 14;
    }
    this.resetBtn?.classList.toggle("hidden", this.phase !== "play" || this.chain.playing);
    this.world.step();

    this.authored(now);
    this.world.tickPaper(now);
    const before = this.chain.events.length;
    this.chain.tick(this.world, now);
    const added = this.chain.events.slice(before);
    if (added.length) {
      this.audio.thud(1.4);
      if (added.includes("wet>short")) {
        this.audio.zap();
        this.audio.surgeRise(1.4);
      }
      if (added.includes("lamp>burst")) {
        this.audio.bulbBurst();
      }
      if (added.includes("blackout")) {
        this.audio.breakerPop();
      }
      if (added.includes("paper>lamp") || added.includes("lamp-poke")) this.audio.clink();
      if (this.chain.punchline) this.audio.scream();
      this.noteChain();
    }
    if (this.chain.paperFan) this.world.fanBlow();
    if (this.chain.peakShake) this.chain.peakShake = 0;

    this.trackMoved();
    if (this.chain.punchline && now % 400 < 20) {
      this.chain.copierPage = Math.min(40, this.chain.copierPage + 1);
      this.world.copierPage = this.chain.copierPage;
    }
    this.maybeCard(now);
    this.test?.tick(now);
    this.world.render();
    requestAnimationFrame(this.frame);
  };

  private authored(now: number) {
    const w = this.world;
    if (this.playerHits.has("cup") && !this.chain.coffee && this.cupPokeAt && now - this.cupPokeAt > 280) {
      const cup = w.get("cup");
      const close = w.dist(cup, w.get("printer")) < 0.55;
      if (close) {
        w.dumpCupIntoPrinter();
        const before = this.chain.events.length;
        this.chain.startCoffee(w, now);
        if (this.chain.events.length > before) {
          this.audio.slosh();
          this.audio.grind();
          this.noteChain();
        }
      }
    }
  }

  private advancePhase(now: number) {
    const dt = now - this.phaseAt;
    if (this.phase === "boot" && dt > 1500) this.enter("title");
    else if (this.phase === "title" && dt > 1600) this.enter("constraint");
    else if (this.phase === "constraint" && dt > 1800) this.enter("play");
  }

  private trackMoved() {
    for (const [label, body] of this.world.byLabel) {
      if (body.isStatic) continue;
      const v = Math.hypot(body.velocity.x, body.velocity.y, body.velocity.z);
      if (v > 0.15) this.moved.add(label);
      if (label === "plant" && v > 0.25) this.world.plantBroken = true;
      if (label === "bag" && v > 0.25) this.world.bagSpilled = true;
    }
    for (const p of this.world.papers) {
      if (Math.hypot(p.velocity.x, p.velocity.y, p.velocity.z) > 0.1) this.moved.add("paper");
    }
  }

  private maybeCard(now: number) {
    if (this.test?.skipCard()) return;
    if (this.cardShown || this.phase !== "play") return;
    if (this.chain.playing) return;
    const started = this.fuse || this.playerHits.size > 0;
    if (!started) return;
    const sinceHit = now - this.lastHit;
    const quiet = sinceHit > 3200 && this.chain.events.length === 0 && this.playerHits.size > 0;
    const afterPunch =
      this.chain.punchline && now > this.chain.slowMoUntil + 900 && sinceHit > 600;
    if (afterPunch || quiet) this.showCard();
  }

  private showCard() {
    this.cardShown = true;
    this.phase = "card";
    const chainLen = this.chain.events.length;
    const chaos = Math.min(180, chainLen * 26 + (this.chain.punchline ? 20 : 0));
    const satisfaction = this.chain.punchline
      ? Math.min(140, 78 + chainLen * 8)
      : Math.min(40, chainLen * 10);
    const plantBystanderBonus =
      this.world.plantBroken && !this.playerHits.has("plant") ? 5 : 0;
    const fault = Math.max(
      0,
      [...this.moved].filter((l) => !this.playerHits.has(l)).length +
        (this.moved.has("paper") ? 4 : 0) +
        (this.chain.punchline ? 6 : 0) +
        plantBystanderBonus,
    );
    const iDidThat = this.extraWrecks.size;
    this.chrome.card({
      headline: this.headline(chainLen, iDidThat),
      chaos,
      satisfaction,
      fault,
      iDidThat,
      onAgain: () => this.again(),
    });
  }

  private headline(chainLen: number, iDidThat: number) {
    if (this.chain.punchline && chainLen >= 4) return "THAT ESCALATED QUICKLY.";
    if (this.chain.punchline) return "THE PRINTER STARTED IT.";
    if (iDidThat >= 3) return "YOU NEEDED THAT.";
    if (chainLen <= 1 && iDidThat > 0) return "YOU JUST HIT THINGS.";
    if (chainLen <= 1) return "YOU JUST POKED IT.";
    return "THAT WAS JUST A MESS.";
  }

  private skipToPlay() {
    this.resetWorld();
    this.enter("play");
    this.test?.resetTracking();
  }

  private probe(id: string): string {
    if (this.phase !== "play" && this.phase !== "card") this.skipToPlay();
    const sim = this.world.get(id as ObjLabel);
    if (!sim) return "missing";

    this.playerHits.add(id);
    this.lastHit = performance.now();
    if (!this.fuse) this.fuse = id;
    else if (id !== this.fuse) this.extraWrecks.add(id);

    if (id === "cup") {
      this.world.cupBody.body.wakeUp();
      this.world.cupBody.body.applyImpulse(
        new CANNON.Vec3(
          0.42 * this.world.cupBody.body.mass,
          0.20 * this.world.cupBody.body.mass,
          -0.48 * this.world.cupBody.body.mass,
        ),
        this.world.cupBody.body.position,
      );
      this.audio.slosh();
      if (!this.cupPokeAt) this.cupPokeAt = performance.now();
      const before = this.chain.events.length;
      this.chain.startCoffee(this.world, performance.now());
      if (this.chain.events.length > before) {
        this.audio.grind();
        this.noteChain();
      }
      const note = "coffee into printer";
      this.test?.notifyHit(id, note);
      return note;
    }
    if (id === "plant") {
      this.world.plantAssembly?.pokeFoliage(
        new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.15, (Math.random() - 0.5) * 0.4),
      );
      this.audio.plant();
      const note = "sway";
      this.test?.notifyHit(id, note);
      return note;
    }
    if (id === "bag") {
      this.world.bagAssembly?.pokeHandle(
        0,
        new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.25, (Math.random() - 0.5) * 0.4),
      );
      this.audio.thud(0.8);
      const note = "vent";
      this.test?.notifyHit(id, note);
      return note;
    }
    if (id === "lamp") {
      this.world.lampAssembly?.pokeShade(new THREE.Vector3(-0.4, 0.1, 0.6));
      this.chain.startLamp(this.world, performance.now());
      const note = "swing";
      this.test?.notifyHit(id, note);
      return note;
    }
    if (id === "phone") {
      this.world.impulse(sim, { x: 0.8, y: 0.05, z: 0.35 });
      this.chain.startPhone(this.world, performance.now());
      const note = "walk";
      this.test?.notifyHit(id, note);
      return note;
    }
    if (id === "jam") {
      this.world.yankJam();
      this.chain.startJam(this.world, performance.now());
      const note = "yank";
      this.test?.notifyHit(id, note);
      return note;
    }
    if (id === "fan") {
      this.world.fanBlow();
      const note = "rattle";
      this.test?.notifyHit(id, note);
      return note;
    }
    if (id === "printer") {
      this.audio.grind();
      const note = "lame beep";
      this.test?.notifyHit(id, note);
      return note;
    }
    if (id === "copier") {
      this.audio.thud(2);
      const note = "thud, no 847";
      this.test?.notifyHit(id, note);
      return note;
    }
    if (id === "chair") {
      this.world.impulse(sim, { x: 1.2, y: 0, z: -0.8 });
      const note = "mass";
      this.test?.notifyHit(id, note);
      return note;
    }
    const note = "moved";
    this.test?.notifyHit(id, note);
    return note;
  }

  private noteChain() {
    this.test?.notifyChain(this.chain.events);
  }

  again() {
    this.resetWorld();
    this.enter("play");
    this.test?.resetTracking();
  }

  destroy() {
    this.running = false;
    this.interaction?.destroy();
    this.world?.destroy();
  }
}
