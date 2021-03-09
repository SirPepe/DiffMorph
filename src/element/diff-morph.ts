import debounce from "debounce";
import { diffAll } from "../diff";
import { processCode } from "../input/fromDom";
import { applyLanguage } from "../language";
import { toKeyframes } from "../render/keyframes";
import { toDom } from "../render/toDom";

const LANGS = new Set(["json"]);

export class DMFrame extends HTMLElement {
  public get [Symbol.toStringTag](): string {
    return "DiffMorphFrameElement";
  }
}

export class DiffMorph extends HTMLElement {
  private numFrames = 0;
  private currentFrame = -1;
  private shadow: ShadowRoot;
  private source: HTMLSlotElement;
  private content: HTMLElement;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.source = document.createElement("slot");
    this.source.hidden = true;
    this.source.addEventListener("slotchange", () => this.init());
    this.content = document.createElement("div");
    this.shadow.append(this.source, this.content);
  }

  static get observedAttributes(): string[] {
    return ["class"];
  }

  public attributeChangedCallback(name: string): void {
    if (name === "class") {
      this.init();
    }
  }

  private computeFrame(input: any): number {
    let value = Number(input);
    if (!value || Number.isNaN(value) || !Number.isFinite(value) || value < 0) {
      value = 0;
    }
    if (value > this.numFrames - 1) {
      value = this.numFrames - 1;
    }
    return value;
  }

  public init = debounce(this._init);
  private async _init(): Promise<void> {
    if (LANGS.has(this.language)) {
      const { languageDefinition, gluePredicate } = await import(
        `../languages/${this.language}`
      );
      const sources = this.source.assignedElements().filter((element: any) => {
        return element[Symbol.toStringTag] === "DiffMorphFrameElement";
      });
      this.numFrames = sources.length;
      const tokens = sources.map((source) => {
        return applyLanguage(languageDefinition, gluePredicate, [
          processCode(source)[0],
        ]);
      });
      const rendered = toDom(toKeyframes(diffAll(tokens)));
      this.shadow.replaceChild(rendered, this.content);
      this.content = rendered;
      if (this.currentFrame === -1 || this.currentFrame > this.numFrames - 1) {
        this.frame = this.computeFrame(this.getAttribute("frame"));
      }
    } else {
      throw new Error("LANGUAGE NOT SUPPORTED RIGHT NOW");
    }
  }

  public next(): void {
    if (this.frame < this.frames - 1) {
      this.frame = this.frame + 1;
    } else {
      this.frame = 0;
    }
  }

  public prev(): void {
    if (this.frame > 0) {
      this.frame = this.frame - 1;
    } else {
      this.frame = this.frames - 1;
    }
  }

  get frame(): number {
    return this.currentFrame;
  }

  set frame(input: number) {
    const value = this.computeFrame(input);
    this.content.classList.remove(`frame${this.currentFrame}`);
    this.content.classList.add(`frame${value}`);
    this.currentFrame = value;
  }

  get frames(): number {
    return this.numFrames;
  }

  get language(): string {
    const match = /language-([a-zA-Z0-9-_]+)/.exec(this.className);
    if (!match) {
      return "none";
    }
    return match[1] || "none";
  }
}

window.customElements.define("dm-frame", DMFrame);
window.customElements.define("diff-morph", DiffMorph);
