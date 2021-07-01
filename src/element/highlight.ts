import debounce from "debounce";
import { fromElement, toHighlight } from "../highlight/dom";

export class HighlightedCode extends HTMLElement {
  #slot: HTMLSlotElement;
  #stage: HTMLDivElement;

  constructor() {
    super();
    this.#slot = document.createElement("slot");
    this.#slot.hidden = true;
    this.#stage = document.createElement("div");
    this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.innerHTML = ":host { display: block }";
    this.shadowRoot?.append(this.#slot, this.#stage, style);
  }

  public connectedCallback(): void {
    this.#slot.addEventListener("slotchange", () => this.init());
  }

  static get observedAttributes(): string[] {
    return ["tabsize"];
  }

  public attributeChangedCallback(name: string): void {
    if (name === "tabsize") {
      this.init();
    }
  }

  public init = debounce(this._init);
  private _init(): void {
    this.#stage.innerHTML = "";
    const source = this.#slot.assignedElements().find((element: any) => {
      return element.tagName === "PRE";
    });
    if (!source) {
      return;
    }
    const renderData = fromElement(source, {
      tabSize: this.tabSize,
    });
    this.#stage.append(...toHighlight(renderData));
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
}

if (!window.customElements.get("highlighted-code")) {
  window.customElements.define("highlighted-code", HighlightedCode);
}
