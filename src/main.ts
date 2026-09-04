import "./style.css";
import { Game } from "./game";
import { bootNative } from "./native";
import { CupSandboxWorld, type SandboxPropId } from "./sandbox/CupSandboxWorld";

type AppMode = "office" | "sandbox";

class AppManager {
  private canvas: HTMLCanvasElement;
  private chrome: HTMLElement;
  private mode: AppMode = "office";
  private game: Game | null = null;
  private sandbox: CupSandboxWorld | null = null;
  private hudInterval = 0;

  private btnOffice: HTMLButtonElement;
  private btnSandbox: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private hudResetBtn: HTMLButtonElement | null;
  private sandboxHud: HTMLElement;
  private sandboxItemBar: HTMLElement;
  private itemButtons: NodeListOf<HTMLButtonElement>;
  private hudLiquid: HTMLElement;
  private hudTilt: HTMLElement;
  private hudStatus: HTMLElement;

  constructor(canvas: HTMLCanvasElement, chrome: HTMLElement) {
    this.canvas = canvas;
    this.chrome = chrome;

    this.btnOffice = document.querySelector<HTMLButtonElement>("#btn-office")!;
    this.btnSandbox = document.querySelector<HTMLButtonElement>("#btn-sandbox")!;
    this.resetBtn = document.querySelector<HTMLButtonElement>("#reset-room")!;
    this.hudResetBtn = document.querySelector<HTMLButtonElement>("#btn-hud-reset");
    this.sandboxHud = document.querySelector<HTMLElement>("#sandbox-hud")!;
    this.sandboxItemBar = document.querySelector<HTMLElement>("#sandbox-item-bar")!;
    this.itemButtons = document.querySelectorAll<HTMLButtonElement>(".item-btn");
    this.hudLiquid = document.querySelector<HTMLElement>("#hud-liquid")!;
    this.hudTilt = document.querySelector<HTMLElement>("#hud-tilt")!;
    this.hudStatus = document.querySelector<HTMLElement>("#hud-status")!;

    this.btnOffice.addEventListener("click", () => this.switchMode("office"));
    this.btnSandbox.addEventListener("click", () => this.switchMode("sandbox"));

    const triggerReset = (e?: Event) => {
      e?.preventDefault();
      e?.stopPropagation();
      if (this.mode === "sandbox" && this.sandbox) {
        this.sandbox.reset();
      } else if (this.mode === "office" && this.game) {
        this.game.again();
      }
    };

    this.resetBtn.addEventListener("pointerdown", triggerReset);
    this.resetBtn.addEventListener("click", triggerReset);
    this.hudResetBtn?.addEventListener("pointerdown", triggerReset);
    this.hudResetBtn?.addEventListener("click", triggerReset);

    this.itemButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const itemId = btn.dataset.item as SandboxPropId | undefined;
        if (itemId && this.sandbox) {
          this.itemButtons.forEach((b) => b.classList.toggle("active", b === btn));
          this.sandbox.selectItem(itemId);
        }
      });
    });

    const urlParams = new URLSearchParams(location.search);
    const initialMode: AppMode =
      urlParams.has("sandbox") || urlParams.get("mode") === "sandbox" ? "sandbox" : "office";

    this.switchMode(initialMode);
  }

  switchMode(newMode: AppMode) {
    this.mode = newMode;
    this.btnOffice.classList.toggle("active", newMode === "office");
    this.btnSandbox.classList.toggle("active", newMode === "sandbox");

    if (this.hudInterval) {
      clearInterval(this.hudInterval);
      this.hudInterval = 0;
    }

    if (newMode === "office") {
      this.resetBtn.textContent = "RESET ROOM";
      this.sandboxHud.classList.add("hidden");
      this.sandboxItemBar.classList.add("hidden");
      if (this.sandbox) {
        this.sandbox.destroy();
        this.sandbox = null;
      }
      this.chrome.style.display = "";
      this.game = new Game(this.canvas, this.chrome);
    } else {
      if (this.game) {
        this.game.destroy();
        this.game = null;
      }
      this.chrome.style.display = "none";
      this.chrome.innerHTML = "";
      document.getElementById("test-toggle")?.classList.add("hidden");
      document.getElementById("test-panel")?.classList.add("hidden");
      this.resetBtn.textContent = "↺ RESET";
      this.resetBtn.classList.remove("hidden");
      this.sandboxHud.classList.remove("hidden");
      this.sandboxItemBar.classList.remove("hidden");

      this.sandbox = new CupSandboxWorld(this.canvas);
      this.hudInterval = window.setInterval(() => this.updateSandboxHud(), 60);
    }
  }

  private updateSandboxHud() {
    if (!this.sandbox) return;
    const propId = this.sandbox.activePropId;
    if (propId === "cup") {
      const cup = this.sandbox.cup;
      this.hudLiquid.textContent = `${Math.round(cup.liquidMl)} mL`;
      this.hudTilt.textContent = `${Math.round(cup.getTiltAngleDeg())}°`;
      if (cup.isBroken) {
        this.hudStatus.textContent = "SHATTERED";
        this.hudStatus.style.color = "#e07a6a";
      } else if (cup.liquidMl <= 1) {
        this.hudStatus.textContent = "EMPTY";
        this.hudStatus.style.color = "#c8b56a";
      } else {
        this.hudStatus.textContent = "INTACT";
        this.hudStatus.style.color = "#8fd18f";
      }
    } else {
      const body = this.sandbox.props.get(propId)?.body;
      const vel = body ? Math.hypot(body.velocity.x, body.velocity.y, body.velocity.z) : 0;
      const speedStr = vel > 0.05 ? `${vel.toFixed(1)} m/s` : "RESTING";

      if (propId === "phone") {
        this.hudLiquid.textContent = "195 g";
        this.hudTilt.textContent = speedStr;
        this.hudStatus.textContent = "ACTIVE";
        this.hudStatus.style.color = "#8fd18f";
      } else if (propId === "fan") {
        this.hudLiquid.textContent = "1.25 kg";
        this.hudTilt.textContent = speedStr;
        this.hudStatus.textContent = "BLOWING";
        this.hudStatus.style.color = "#7ab8e8";
      } else if (propId === "plant") {
        const plantItem = this.sandbox.props.get("plant") as { assembly?: { soilRemainingMl: number; getTiltAngleDeg: () => number; potState: string; foliageState: string; soilState: string } } | undefined;
        if (plantItem?.assembly) {
          this.hudLiquid.textContent = `${Math.round(plantItem.assembly.soilRemainingMl)} mL SOIL`;
          this.hudTilt.textContent = `${Math.round(plantItem.assembly.getTiltAngleDeg())}°`;
          if (plantItem.assembly.potState === "shattered") {
            this.hudStatus.textContent = "SHATTERED";
            this.hudStatus.style.color = "#e07a6a";
          } else if (plantItem.assembly.foliageState === "uprooted") {
            this.hudStatus.textContent = "UPROOTED";
            this.hudStatus.style.color = "#e0a56a";
          } else if (plantItem.assembly.soilState === "spilling") {
            this.hudStatus.textContent = "SPILLING";
            this.hudStatus.style.color = "#c8b56a";
          } else {
            this.hudStatus.textContent = "INTACT";
            this.hudStatus.style.color = "#8fd18f";
          }
        } else {
          this.hudLiquid.textContent = "5.2 kg";
          this.hudTilt.textContent = speedStr;
          this.hudStatus.textContent = "CERAMIC";
          this.hudStatus.style.color = "#8fd18f";
        }
      } else if (propId === "printer") {
        this.hudLiquid.textContent = "8.5 kg";
        this.hudTilt.textContent = speedStr;
        this.hudStatus.textContent = "READY";
        this.hudStatus.style.color = "#8fd18f";
      } else if (propId === "lamp") {
        const lampItem = this.sandbox.props.get("lamp") as { assembly?: { bulbState: string; powerState: string } } | undefined;
        if (lampItem?.assembly) {
          this.hudLiquid.textContent = lampItem.assembly.powerState.toUpperCase();
          this.hudTilt.textContent = speedStr;
          if (lampItem.assembly.bulbState === "burst") {
            this.hudStatus.textContent = "BURST";
            this.hudStatus.style.color = "#e07a6a";
          } else if (lampItem.assembly.powerState === "surging") {
            this.hudStatus.textContent = "SURGING";
            this.hudStatus.style.color = "#ffffff";
          } else {
            this.hudStatus.textContent = "LIT";
            this.hudStatus.style.color = "#f4d068";
          }
        } else {
          this.hudLiquid.textContent = "1.85 kg";
          this.hudTilt.textContent = speedStr;
          this.hudStatus.textContent = "GLOWING";
          this.hudStatus.style.color = "#f4d068";
        }
      } else if (propId === "chair") {
        this.hudLiquid.textContent = "14.8 kg";
        this.hudTilt.textContent = speedStr;
        this.hudStatus.textContent = "ROLLING";
        this.hudStatus.style.color = "#8fd18f";
      } else if (propId === "bag") {
        const bagItem = this.sandbox.props.get("bag") as { assembly?: { payloads: Array<{ isContained: boolean }>; getTiltAngleDeg: () => number; spillState: string; mouthState: string } } | undefined;
        if (bagItem?.assembly) {
          const contained = bagItem.assembly.payloads.filter((p) => p.isContained).length;
          this.hudLiquid.textContent = `${contained}/6 ITEMS`;
          this.hudTilt.textContent = `${Math.round(bagItem.assembly.getTiltAngleDeg())}°`;
          if (bagItem.assembly.spillState === "spilled") {
            this.hudStatus.textContent = "SPILLED";
            this.hudStatus.style.color = "#e07a6a";
          } else if (bagItem.assembly.mouthState === "open") {
            this.hudStatus.textContent = "OPEN";
            this.hudStatus.style.color = "#c8b56a";
          } else {
            this.hudStatus.textContent = "PACKED";
            this.hudStatus.style.color = "#8fd18f";
          }
        } else {
          this.hudLiquid.textContent = "4.8 kg";
          this.hudTilt.textContent = speedStr;
          this.hudStatus.textContent = "CANVAS";
          this.hudStatus.style.color = "#c4a574";
        }
      }
    }
  }
}

const canvas = document.querySelector<HTMLCanvasElement>("#room");
const chrome = document.querySelector<HTMLElement>("#chrome");
if (!canvas || !chrome) throw new Error("missing stage");

void bootNative().finally(() => {
  new AppManager(canvas, chrome);
});
