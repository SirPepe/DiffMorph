import debounce from "debounce";
import { fromElement, toHighlight } from "../highlight/dom";

export class HighlightedCode extends HTMLElement {
  #stage: HTMLDivElement;
  #contentObserver = new MutationObserver(() => this.init());

  constructor() {
    super();
    this.#stage = document.createElement("div");
    this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.innerHTML = ":host { display: block }";
    this.shadowRoot?.append(this.#stage, style);
  }

  public connectedCallback(): void {
    this.#contentObserver.observe(this, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
    this.init();
  }

  public disconnectCallback(): void {
    this.#contentObserver.disconnect();
  }

  public init = debounce(this._init);
  private _init(): void {
    this.#stage.innerHTML = "";
    const source = Array.from(this.children).find((element: any) => {
      return element.tagName === "PRE";
    });
    if (!source) {
      return;
    }
    const renderData = fromElement(source, { tabSize: this.tabSize });
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
