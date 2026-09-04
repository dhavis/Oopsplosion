import type { OfficeWorld, SimBody } from "./world";

function hit(a: SimBody, b: SimBody, x: string, y: string) {
  return (a.label === x && b.label === y) || (a.label === y && b.label === x);
}

type Beat = {
  id: string;
  at: number;
  done: boolean;
  aim?: string;
  run: (world: OfficeWorld) => void;
};

export class Chain {
  events: string[] = [];
  coffee = false;
  jamYank = false;
  lampSwing = false;
  phoneWalk = false;
  punchline = false;
  printerFeral = false;
  cupEmpty = false;
  paperFan = false;
  copierPage = 1;
  slowMoUntil = 0;
  peakShake = 0;
  activeLabel: string | null = null;
  aim: "fan" | "lamp" | "chair" | "copier" | null = null;
  playing = false;

  private seen = new Set<string>();
  private beats: Beat[] = [];

  link(name: string) {
    if (this.seen.has(name)) return false;
    this.seen.add(name);
    this.events.push(name);
    return true;
  }

  tick(world: OfficeWorld, now: number) {
    for (const beat of this.beats) {
      if (beat.done || now < beat.at) continue;
      beat.done = true;
      this.link(beat.id);
      if (beat.aim) this.aim = beat.aim as Chain["aim"];
      this.activeLabel = beat.aim ?? this.activeLabel;
      beat.run(world);
    }
    const hasPendingBeats = this.beats.some((b) => !b.done);
    if (this.playing && !hasPendingBeats && now > this.slowMoUntil) {
      this.playing = false;
    }
  }

  handle(world: OfficeWorld, a: SimBody, b: SimBody, now: number) {
    if (!this.coffee && !this.playing && hit(a, b, "cup", "printer")) {
      const cup = a.label === "cup" ? a : b;
      const speed = Math.hypot(cup.velocity.x, cup.velocity.y, cup.velocity.z);
      if (speed >= 0.12 && this.link("cup>printer")) {
        this.playCoffee(world, now);
        return "coffee";
      }
    }
    if (!this.coffee && !this.playing && hit(a, b, "jam", "fan") && this.link("jam>fan")) {
      this.playJam(world, now);
      return "jam";
    }
    if (!this.coffee && !this.playing && hit(a, b, "phone", "cup") && this.link("phone>cup")) {
      this.playPhone(world, now);
      return "phone";
    }
    if (hit(a, b, "lamp", "chair")) {
      if (this.link("lamp>chair")) {
        this.peakShake = 6;
        world.lampHitsChair();
        return "lamp-chair";
      }
    }
    if (hit(a, b, "chair", "copier")) {
      if (this.link("chair>copier")) {
        this.wakeCopier(world);
        return "chair-copier";
      }
    }
    if (hit(a, b, "phone", "copier")) {
      if (this.link("phone>copier")) {
        this.wakeCopier(world);
        return "phone-copier";
      }
    }
    if (hit(a, b, "chair", "plant")) {
      world.plantBroken = true;
      return "plant";
    }
    if (hit(a, b, "chair", "bag")) {
      world.bagSpilled = true;
      return "bag";
    }
    return null;
  }

  startCoffee(world: OfficeWorld, now: number) {
    if (this.coffee || this.playing) return;
    this.link("cup>printer");
    this.playCoffee(world, now);
  }

  startJam(world: OfficeWorld, now: number) {
    if (this.jamYank || this.playing) return;
    this.link("jam>fan");
    this.playJam(world, now);
  }

  startLamp(world: OfficeWorld, now: number) {
    if (this.lampSwing || this.playing) return;
    this.link("lamp-poke");
    this.playLamp(world, now);
  }

  startPhone(world: OfficeWorld, now: number) {
    if (this.phoneWalk || this.playing) return;
    this.link("phone>cup");
    this.playPhone(world, now);
  }

  private begin(now: number, hold: number) {
    this.playing = true;
    this.slowMoUntil = now + Math.min(hold, 1200);
    this.peakShake = 4;
  }

  playCoffee(world: OfficeWorld, now: number) {
    this.coffee = true;
    this.cupEmpty = true;
    world.cupEmpty = true;
    this.aim = "fan";
    this.activeLabel = "printer";
    this.begin(now, 8600);
    this.queue(now, [
      {
        id: "wet>short",
        wait: 240,
        aim: "printer",
        run: (w) => {
          this.printerFeral = true;
          w.wetShort();
        },
      },
      {
        id: "paper>fan",
        wait: 1400,
        aim: "fan",
        run: (w) => {
          this.paperFan = true;
          this.peakShake = 5;
          w.fanSpin = 28;
          w.fanBlow();
          w.kickPapersAt(w.get("lamp").position, 0.62);
          w.coughPrinter(4, performance.now(), 140, true);
        },
      },
      {
        id: "surge>lamp",
        wait: 2000,
        aim: "lamp",
        run: (w) => {
          w.startLampSurge();
        },
      },
      {
        id: "paper>lamp",
        wait: 2600,
        aim: "lamp",
        run: (w) => {
          this.lampSwing = true;
          this.peakShake = 6;
          w.swingLamp(1.4);
          w.fanBlow();
          w.coughPrinter(3, performance.now(), 140, true);
        },
      },
      {
        id: "lamp>burst",
        wait: 3100,
        aim: "lamp",
        run: (w) => {
          this.peakShake = 7;
          w.burstLampBulb();
        },
      },
      {
        id: "lamp>chair",
        wait: 4000,
        aim: "chair",
        run: (w) => {
          this.peakShake = 7;
          w.lampHitsChair();
        },
      },
      {
        id: "chair>copier",
        wait: 5200,
        aim: "copier",
        run: (w) => this.wakeCopier(w),
      },
      {
        id: "blackout",
        wait: 6000,
        aim: "copier",
        run: (w) => {
          w.popBreaker();
        },
      },
    ]);
    world.coughPrinter(5, now + 900, 140, true);
  }

  playJam(world: OfficeWorld, now: number) {
    this.jamYank = true;
    this.paperFan = true;
    this.aim = "fan";
    this.activeLabel = "fan";
    this.begin(now, 8600);
    world.fanSpin = 28;
    world.yankJam();
    world.coughPrinter(6, now, 140);
    this.queue(now, [
      {
        id: "paper>lamp",
        wait: 2000,
        aim: "lamp",
        run: (w) => {
          this.peakShake = 6;
          w.swingLamp(1.4);
          w.fanBlow();
          w.coughPrinter(4, performance.now(), 140);
        },
      },
      {
        id: "lamp>chair",
        wait: 4000,
        aim: "chair",
        run: (w) => {
          this.peakShake = 6;
          w.lampHitsChair();
        },
      },
      {
        id: "chair>copier",
        wait: 6200,
        aim: "copier",
        run: (w) => this.wakeCopier(w),
      },
    ]);
  }

  playLamp(world: OfficeWorld, now: number) {
    this.lampSwing = true;
    this.aim = "chair";
    this.activeLabel = "lamp";
    this.begin(now, 7200);
    world.swingLamp(1.6);
    this.queue(now, [
      {
        id: "lamp>chair",
        wait: 1800,
        aim: "chair",
        run: (w) => {
          this.peakShake = 6;
          w.lampHitsChair();
        },
      },
      {
        id: "chair>copier",
        wait: 4000,
        aim: "copier",
        run: (w) => this.wakeCopier(w),
      },
    ]);
  }

  playPhone(world: OfficeWorld, now: number) {
    this.phoneWalk = true;
    this.aim = "copier";
    this.activeLabel = "phone";
    this.begin(now, 7200);
    world.walkPhone();
    this.queue(now, [
      {
        id: "phone>copier",
        wait: 2400,
        aim: "copier",
        run: (w) => {
          this.peakShake = 5;
          w.jostle("phone", 0.45, 0.04, 0.28);
        },
      },
      {
        id: "copier-wake",
        wait: 4400,
        aim: "copier",
        run: (w) => this.wakeCopier(w),
      },
    ]);
  }

  wakeCopier(world?: OfficeWorld) {
    if (this.punchline) return;
    this.punchline = true;
    this.printerFeral = true;
    this.slowMoUntil = Math.max(this.slowMoUntil, performance.now() + 2200);
    this.peakShake = 8;
    this.activeLabel = "copier";
    this.aim = "copier";
    this.link("copier-wake");
    this.link("chair>copier");
    if (world) {
      world.printerFeral = true;
      world.copierVomit();
    }
  }

  private queue(
    now: number,
    beats: { id: string; wait: number; aim?: string; run: (w: OfficeWorld) => void }[],
  ) {
    this.beats = beats.map((b) => ({
      id: b.id,
      at: now + b.wait,
      done: false,
      aim: b.aim,
      run: b.run,
    }));
  }
}
