import debounce from "debounce";
import { fromDom } from "../input/fromDom";
import { toDom } from "../output/toDom";

function isElement(x: any): x is Element {
  if (!x || typeof x !== "object") {
    return false;
  }
  return x.nodeType === 1;
}

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
    <span class="dm-controls-curr"></span>
    /
    <span class="dm-controls-total"></span>
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
  pre {
    margin: 0;
  }
  .dm {
    margin: 0;
    --line-height: var(--dm-line-height, 2.5ch);
    line-height: var(--line-height);
    height: calc(var(--max-height) * var(--line-height));
    width: calc(var(--max-width) * 1ch);
  }
`;
  return element;
}

function createShadowDom(): [
  HTMLDivElement, // wrapper element
  HTMLDivElement, // keyframe container
  HTMLStyleElement, // element styles
  HTMLSlotElement, // data source
  (curr: number, total: number) => void // updater function
] {
  const slot = document.createElement("slot");
  slot.hidden = true; // Slot content is just am invisible data source
  const wrapper = document.createElement("div");
  wrapper.className = "dm-wrapper";
  const content = document.createElement("div");
  const controls = createControls();
  const currentIndex = controls.querySelector(".dm-controls-curr") as Element;
  const totalFrames = controls.querySelector(".dm-controls-total") as Element;
  wrapper.append(content, controls);
  function update(curr: number, total: number): void {
    currentIndex.innerHTML = String(curr);
    totalFrames.innerHTML = String(total);
  }
  return [wrapper, content, createStyles(), slot, update];
}

export class DiffMorph extends HTMLElement {
  private maxWidth = 0;
  private maxHeight = 0;
  private numFrames = 0;
  private currentFrame = -1;
  private shadow: ShadowRoot;
  private source: HTMLSlotElement;
  private content: HTMLElement;
  private updater: (curr: number, total: number) => void;
  private autoplayTimeout: any;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    const [wrapper, content, styles, source, updater] = createShadowDom();
    this.content = content;
    this.source = source;
    this.updater = updater;
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
    return ["class", "autoplay"];
  }

  public attributeChangedCallback(name: string): void {
    if (name === "class") {
      this.init();
    }
    if (name === "autoplay") {
      this.toggleAutoplay(this.hasAttribute("autoplay"));
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

  private toggleAutoplay(enable: boolean): void {
    window.clearTimeout(this.autoplayTimeout);
    if (enable) {
      const self = this; // eslint-disable-line
      this.autoplayTimeout = window.setTimeout(function doNext() {
        self.next();
        self.autoplayTimeout = window.setTimeout(doNext, 1000);
      }, 1000);
    }
  }

  public init = debounce(this._init);
  private _init(): void {
    const sources = this.source.assignedElements().filter((element: any) => {
      return element[Symbol.toStringTag] === "DiffMorphFrameElement";
    });
    this.numFrames = sources.length;
    const inputData = fromDom(sources, this.language);
    inputData.objects.data.tagName = "code";
    const [newContent, maxWidth, maxHeight] = toDom(inputData);
    if (!this.content.parentElement) {
      throw new Error();
    }
    this.maxWidth = maxWidth;
    this.maxHeight = maxHeight;
    this.content.parentElement.setAttribute(
      "style",
      `--max-width:${maxWidth}; --max-height:${maxHeight}`
    );
    this.content.parentElement.replaceChild(newContent, this.content);
    this.content = newContent;
    if (this.currentFrame === -1 || this.currentFrame > this.numFrames - 1) {
      this.index = 0;
    } else {
      // triggers reset of the frame attribute in the shadow dom
      this.index = this.index; // eslint-disable-line
    }
    this.dispatchEvent(new Event("initialize"));
  }

  public next(): void {
    if (this.index < this.size - 1) {
      this.index = this.index + 1;
    } else {
      this.index = 0;
    }
  }

  public prev(): void {
    if (this.index > 0) {
      this.index = this.index - 1;
    } else {
      this.index = this.size - 1;
    }
  }

  get index(): number {
    return this.currentFrame;
  }

  set index(input: number) {
    const value = this.computeFrame(input);
    this.content.classList.remove(`frame${this.currentFrame}`);
    this.content.classList.add(`frame${value}`);
    this.updater(value + 1, this.size);
    this.currentFrame = value;
  }

  get size(): number {
    return this.numFrames;
  }

  get width(): number {
    return this.maxWidth;
  }

  get height(): number {
    return this.maxHeight;
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
