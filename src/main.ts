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
    if (this.sandbox.activePropId === "cup") {
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
      const propId = this.sandbox.activePropId;
      this.hudLiquid.textContent = "N/A";
      this.hudTilt.textContent = "0°";
      this.hudStatus.textContent = propId.toUpperCase();
      this.hudStatus.style.color = "#c4a574";
    }
  }
}

const canvas = document.querySelector<HTMLCanvasElement>("#room");
const chrome = document.querySelector<HTMLElement>("#chrome");
if (!canvas || !chrome) throw new Error("missing stage");

void bootNative().finally(() => {
  new AppManager(canvas, chrome);
});
