import { diffAll } from "../diff";
import { processCode } from "../input/fromDom";
import { applyLanguage } from "../language";
import { toKeyframes } from "../render/keyframes";
import { toDom } from "../render/toDom";

const LANGS = {
  json: () => import("../languages/json"),
};

export class DMFrame extends HTMLElement {
  public get [Symbol.toStringTag](): string {
    return "DiffMorphFrameElement";
  }
}

export class DiffMorph extends HTMLElement {
  #shadow: ShadowRoot;
  #source: HTMLSlotElement;
  #content: HTMLElement;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#shadow = this.attachShadow({ mode: "open" });
    this.#source = document.createElement("slot");
    this.#source.hidden = true;
    this.#content = document.createElement("div");
    this.#shadow.append(this.#source, this.#content);
  }

  static get observedAttributes(): string[] {
    return ["class"];
  }

  public attributeChangedCallback(name: string): void {
    if (name === "class") {
      this.init();
    }
  }

  public connectedCallback(): void {
    this.init();
  }

  private async init(): Promise<void> {
    if (this.language in LANGS) {
      const { languageDefinition, gluePredicate } = await import(
        `../languages${this.language}`
      );
      const sources = this.#source.assignedElements().filter((element: any) => {
        return element[Symbol.toStringTag] === "DiffMorphFrameElement";
      });
      const tokens = sources.map((source) => {
        return applyLanguage(languageDefinition, gluePredicate, [
          processCode(source)[0],
        ]);
      });
      this.#content = toDom(toKeyframes(diffAll(tokens)));
    } else {
      throw new Error("Fail");
    }
  }

  get language(): string {
    const match = /language-([a-zA-Z0-9-_])/.exec(this.className);
    if (!match) {
      return "none";
    }
    return match[1] || "none";
  }
}

window.customElements.define("dm-frame", DMFrame);
window.customElements.define("diff-morph", DiffMorph);
