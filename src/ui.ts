import { copy } from "./theme";

export type ChromeMode = "boot" | "title" | "constraint" | "play" | "miss" | "card";

export class Chrome {
  private root: HTMLElement;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  boot() {
    this.root.innerHTML = `
      <div class="layer boot" data-skip>
        <div class="mark">${copy.mark}</div>
        <div class="tag">${copy.tag}</div>
      </div>`;
  }

  title() {
    this.root.innerHTML = `
      <div class="layer title-block fade">
        <div class="kicker">${copy.title}</div>
        <div class="sub">${copy.sub}</div>
      </div>`;
  }

  constraint() {
    this.root.innerHTML = `
      <div class="layer constraint fade">
        <p>${copy.constraint}</p>
      </div>`;
  }

  play() {
    this.root.innerHTML = "";
  }

  miss() {
    this.root.innerHTML = `
      <div class="layer miss fade">
        <p>${copy.miss}</p>
      </div>`;
  }

  card(opts: {
    headline: string;
    chaos: number;
    satisfaction: number;
    fault: number;
    iDidThat: number;
    onAgain: () => void;
  }) {
    this.root.innerHTML = `
      <div class="layer card-strip fade">
        <div class="strip">
          <div class="headline">${opts.headline}</div>
          <div class="stat"><span>CHAOS</span><span>${opts.chaos}%</span></div>
          <div class="stat"><span>SATISFACTION</span><span>${opts.satisfaction}%</span></div>
          <div class="stat"><span class="fault-label">THINGS THAT DEFINITELY WEREN'T YOUR FAULT</span><span>${opts.fault}</span></div>
          <div class="stat"><span>I DID THAT</span><span>${opts.iDidThat}</span></div>
          <div class="actions">
            <button class="again" type="button">AGAIN</button>
          </div>
        </div>
      </div>`;
    this.root.querySelector(".again")?.addEventListener("click", (e) => {
      e.stopPropagation();
      opts.onAgain();
    });
  }

  onSkip(fn: () => void) {
    this.root.querySelector("[data-skip]")?.addEventListener("click", fn);
  }
}
