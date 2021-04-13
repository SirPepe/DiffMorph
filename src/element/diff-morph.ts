import debounce from "debounce";
import { fromDom } from "../input/fromDom";
import { toDom } from "../output/toDom";

function isElement(x: any): x is Element {
  if (!x || typeof x !== "object") {
    return false;
  }
  return x.nodeType === 1;
}

const LANGS = new Set(["json"]);

export class DMFrame extends HTMLElement {
  public get [Symbol.toStringTag](): string {
    return "DiffMorphFrameElement";
  }
  public get title(): string {
    return this.getAttribute("title") || "";
  }
}

function createControls(): HTMLElement {
  const element = document.createElement("div");
  element.className = "dm-controls";
  element.innerHTML = `
    <button class="dm-controls-prev"><span>Prev</span></button>
    <button class="dm-controls-next"><span>Next</span></button>
  `;
  return element;
}

function createStyles(): HTMLStyleElement {
  const element = document.createElement("style");
  element.innerHTML = `
  :host {
    display: block;
  }
  .dm-wrapper {
    display: flex;
    flex-direction: column;
  }
  .dm-controls {
    display: none;
  }
  :host([controls]) .dm-controls {
    display: block;
  }
  .dm-code {
    margin: 0;
    line-height: 2ch;
    height: calc(var(--max-height) * 2ch);
    width: calc(var(--max-width) * 1ch);
  }
`;
  return element;
}

function createShadowDom(): [
  HTMLDivElement, // wrapper element
  HTMLDivElement, // keyframe container
  HTMLStyleElement, // element styles
  HTMLSlotElement // data source
] {
  const slot = document.createElement("slot");
  slot.hidden = true; // Slot content is just am invisible data source
  const wrapper = document.createElement("div");
  wrapper.className = "dm-wrapper";
  const content = document.createElement("div");
  wrapper.append(content, createControls());
  return [wrapper, content, createStyles(), slot];
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
    const [wrapper, content, styles, source] = createShadowDom();
    this.content = content;
    this.source = source;
    this.shadow.append(source, wrapper, styles);
  }

  public connectedCallback(): void {
    this.source.addEventListener("slotchange", () => this.init());
    this.shadow.addEventListener("click", ({ target }) => {
      if (!isElement(target)) {
        return;
      }
      if (target.matches(".dm-controls-prev, .dm-controls-prev *")) {
        this.prev();
      }
      if (target.matches(".dm-controls-next, .dm-controls-next *")) {
        this.next();
      }
    });
  }

  static get observedAttributes(): string[] {
    return ["class", "controls"];
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
      const { languageDefinition } = await import(
        `../languages/${this.language}`
      );
      const sources = this.source.assignedElements().filter((element: any) => {
        return element[Symbol.toStringTag] === "DiffMorphFrameElement";
      });
      this.numFrames = sources.length;
      const inputData = fromDom(sources, languageDefinition);
      inputData.objects.data.tagName = "span"; // better than <dm-frame>
      const [newContent, maxWidth, maxHeight] = toDom(inputData);
      if (!this.content.parentElement) {
        throw new Error();
      }
      this.content.parentElement.setAttribute(
        "style",
        `--max-width:${maxWidth}; --max-height:${maxHeight}`
      );
      this.content.parentElement.replaceChild(newContent, this.content);
      this.content = newContent;
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
