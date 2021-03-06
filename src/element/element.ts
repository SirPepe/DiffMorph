import debounce from "debounce";
import { fromDom } from "../input/fromDom";
import { getLanguage } from "../lib/dom";
import { toDom } from "../output/toDom";
import { RenderData, RenderDecoration, RenderText } from "../types";

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
    box-sizing: border-box;
  }
  :host * {
    box-sizing: inherit;
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
    font-size: 1em;
    font-family: monospace;
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
  #maxWidth = 0;
  #maxHeight = 0;
  #numFrames = 0;
  #currentFrame = -1;
  #shadow: ShadowRoot;
  #source: HTMLSlotElement;
  #content: HTMLElement;
  #updater: (curr: number, total: number) => void;
  #autoplayTimeout: any;
  #renderData: RenderData<RenderText, RenderDecoration> | null = null;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: "open" });
    const [wrapper, content, styles, source, updater] = createShadowDom();
    this.#content = content;
    this.#source = source;
    this.#updater = updater;
    this.#shadow.append(source, wrapper, styles);
  }

  public connectedCallback(): void {
    this.#source.addEventListener("slotchange", () => this.init());
    this.#shadow.addEventListener("click", ({ target }) => {
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
    return ["class", "autoplay", "index", "tabsize"];
  }

  public attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string
  ): void {
    if (name === "class" || name === "tabsize") {
      this.init();
    }
    if (name === "autoplay") {
      this.toggleAutoplay(this.hasAttribute("autoplay"));
    }
    if (name === "index") {
      this.index = this.computeFrame(newValue);
    }
  }

  private computeFrame(input: any): number {
    let value = parseInt(input, 10);
    if (!value || Number.isNaN(value) || !Number.isFinite(value) || value < 0) {
      value = 0;
    }
    if (value > this.#numFrames - 1) {
      value = this.#numFrames - 1;
    }
    return value;
  }

  private toggleAutoplay(enable: boolean): void {
    window.clearTimeout(this.#autoplayTimeout);
    if (enable) {
      const self = this; // eslint-disable-line
      this.#autoplayTimeout = window.setTimeout(function doNext() {
        self.next();
        self.#autoplayTimeout = window.setTimeout(doNext, 1000);
      }, 1000);
    }
  }

  public get renderData(): RenderData<RenderText, RenderDecoration> | null {
    return this.#renderData;
  }

  public init = debounce(this._init);
  private _init(): void {
    const sources = this.#source.assignedElements().filter((element: any) => {
      return element[Symbol.toStringTag] === "DiffMorphFrameElement";
    });
    this.#numFrames = sources.length;
    this.#renderData = fromDom(sources, {
      languageOverride: this.language,
      tabSize: this.tabSize,
    });
    this.#renderData.objects.data.tagName = "code";
    const [newContent, maxWidth, maxHeight] = toDom(this.#renderData);
    if (!this.#content.parentElement) {
      throw new Error();
    }
    this.#maxWidth = maxWidth;
    this.#maxHeight = maxHeight;
    this.#content.parentElement.setAttribute(
      "style",
      `--max-width:${maxWidth}; --max-height:${maxHeight}`
    );
    this.#content.parentElement.replaceChild(newContent, this.#content);
    this.#content = newContent;
    // triggers reset of the frame attribute in the shadow dom
    this.index = this.computeFrame(this.getAttribute("index"));
    this.dispatchEvent(new Event("initialize"));
  }

  public next(): number {
    if (this.index < this.size - 1) {
      this.index = this.index + 1;
    } else {
      this.index = 0;
    }
    return this.index;
  }

  public prev(): number {
    if (this.index > 0) {
      this.index = this.index - 1;
    } else {
      this.index = this.size - 1;
    }
    return this.index;
  }

  set tabSize(value: number) {
    if (typeof value === "number" && Number.isFinite(value) && value < 0) {
      this.setAttribute("tabsize", String(value));
    }
  }

  get tabSize(): number {
    if (this.hasAttribute("tabsize")) {
      const value = parseInt(this.getAttribute("tabsize") ?? "2", 10);
      if (Number.isFinite(value) && value < 0) {
        return value;
      }
    }
    return 2;
  }

  get index(): number {
    return this.#currentFrame;
  }

  set index(input: number) {
    const value = this.computeFrame(input);
    this.#content.classList.remove(`frame${this.#currentFrame}`);
    this.#content.classList.add(`frame${value}`);
    this.#updater(value + 1, this.size);
    this.#currentFrame = value;
  }

  get size(): number {
    return this.#numFrames;
  }

  get width(): number {
    return this.#maxWidth;
  }

  get height(): number {
    return this.#maxHeight;
  }

  get language(): string {
    return getLanguage(this.className);
  }
}
