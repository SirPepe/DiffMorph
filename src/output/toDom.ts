import {
  DecorationPosition,
  RenderData,
  RenderDecoration,
  RenderPositions,
  RenderRoot,
  RenderText,
} from "../types";
import { languages } from "../languages";
import { createIdGenerator } from "../lib/util";
import { DEFAULT_COLOR_PALETTE, LanguageTheme } from "../lib/theme";

const nextId = createIdGenerator();

const DEFAULT_STYLES = `
.dm-code {
  --foreground: var(--dm-foreground, ${DEFAULT_COLOR_PALETTE.foreground});
  --background: var(--dm-background, ${DEFAULT_COLOR_PALETTE.background});
  --line-height: var(--dm-line-height, 2.5ch);
  --string: var(--dm-string, ${DEFAULT_COLOR_PALETTE.string});
  --number: var(--dm-number, ${DEFAULT_COLOR_PALETTE.number});
  --comment: var(--dm-comment, ${DEFAULT_COLOR_PALETTE.comment});
  --global: var(--dm-global, ${DEFAULT_COLOR_PALETTE.global});
  --type: var(--dm-type, ${DEFAULT_COLOR_PALETTE.type});
  --tag: var(--dm-tag, ${DEFAULT_COLOR_PALETTE.tag});
  --value: var(--dm-value, ${DEFAULT_COLOR_PALETTE.value});
  --literal: var(--dm-literal, ${DEFAULT_COLOR_PALETTE.literal});
  --punctuation: var(--dm-punctuation, ${DEFAULT_COLOR_PALETTE.punctuation});
  transition: transform var(--dm-transition-time, 500ms);
  position: relative;
  color: var(--foreground);
  background-color: var(--background);
  width: 100%;
  height: 100%;
}
.dm-token, .dm-decoration, .dm-box {
  transform-origin: top left;
  overflow: visible;
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  z-index: 1;
}
.dm-decoration {
  z-index: 0;
}
.dm-token, .dm-decoration {
  transition: transform var(--dm-transition-time, 500ms),
              opacity var(--dm-transition-time, 500ms);
}
.dm-box {
  transition: transform var(--dm-transition-time, 500ms);
}`;

function generateTextCss(
  { id, x, y, alpha }: DecorationPosition,
  baseSelector: string,
  offsetX: number,
  offsetY: number
): string[] {
  x -= offsetX;
  y -= offsetY;
  const styles = [];
  const selector = `${baseSelector} > .dm-token.dm-${id}`;
  const rules = [
    `transform:translate(${x}ch, calc(${y} * var(--line-height)))`,
  ];
  if (alpha === 1) {
    rules.push(`opacity:1`);
  }
  styles.push(`${selector}{${rules.join(";")}}`);
  return styles;
}

function generateDecorationCss(
  { id, x, y, width, height, alpha }: DecorationPosition,
  baseSelector: string,
  offsetX: number,
  offsetY: number
): string[] {
  x -= offsetX;
  y -= offsetY;
  const styles = [];
  const selector = `${baseSelector} > .dm-decoration.dm-${id}`;
  const rules = [
    `transform:translate(${x}ch,calc(${y} * var(--line-height)))`,
    `width:${width}ch`,
    `height:calc(${height} * var(--line-height))`,
  ];
  if (alpha === 1) {
    rules.push(`opacity:1`);
  }
  styles.push(`${selector}{${rules.join(";")}}`);
  return styles;
}

// In DOM, boxes are actual objects that create a relative coordinate system for
// their contents. Said contents has absolute coordinates, which we must
// compensate for with extra offsets.
function generateBoxCss(
  { id, x, y, width, height, alpha, frame }: RenderPositions,
  baseSelector: string,
  offsetX: number,
  offsetY: number
): string[] {
  const styles = [];
  const selector = `${baseSelector} > .dm-box.dm-${id}`;
  const rules = [
    `transform:translate(${x}ch,calc(${y} * var(--line-height)))`,
    `width:${width}ch`,
    `height:calc(${height} * var(--line-height))`,
  ];
  if (alpha) {
    rules.push(`opacity:1`);
  }
  styles.push(`${selector}{${rules.join(";")}}`);
  for (const position of frame.text.values()) {
    styles.push(
      ...generateTextCss(position, selector, x - offsetX, y - offsetY)
    );
  }
  for (const position of frame.decorations.values()) {
    styles.push(
      ...generateDecorationCss(position, selector, x - offsetX, y - offsetY)
    );
  }
  for (const position of frame.boxes.values()) {
    styles.push(
      ...generateBoxCss(position, selector, x - offsetX, y - offsetY)
    );
  }
  return styles;
}

function themeToCss(prefix: string, theme: LanguageTheme): string {
  return Object.entries(theme)
    .map(([type, props]) => {
      const selector = `${prefix} .` + type.split(/\s+/).join(".");
      const declarations = Object.entries(props)
        .map(([property, value]) => {
          if (value) {
            if (property === "color") {
              value = `var(--${value})`;
            }
            return `${property}:${value}`;
          }
        })
        .join(";");
      return `${selector}{${declarations}}`;
    })
    .join("\n");
}

function getDefaultStyles(langs: Set<string>): string {
  let css = DEFAULT_STYLES;
  for (const lang of langs) {
    if (lang in languages) {
      css += themeToCss(`.dm-box.language-${lang}`, languages[lang].theme);
    }
  }
  return css;
}

function generateStyle(
  rootFrames: Map<number, RenderPositions>,
  languages: Set<string>,
  rootSelector: string
): HTMLStyleElement {
  const styles = [];
  for (const [frameIdx, rootFrame] of rootFrames) {
    const baseSelector = `${rootSelector}.frame${frameIdx} .dm-code`;
    styles.push(...generateBoxCss(rootFrame, baseSelector, 0, 0));
  }
  const css = getDefaultStyles(languages) + styles.join("\n");
  const element = document.createElement("style");
  element.innerHTML = css; // innerHTML visible when logging element's outerHTML
  return element;
}

function generateText({ id, text, type }: RenderText): HTMLElement {
  const element = document.createElement("span");
  element.className = `${type} dm-token dm-${id}`;
  element.append(text);
  return element;
}

function generateDecoration({ id, data }: RenderDecoration): HTMLElement {
  const { tagName = "mark", attributes = [] } = data;
  const element = document.createElement(tagName);
  element.className = "dm-decoration dm-" + id;
  for (const [attribute, value] of attributes) {
    element.setAttribute(attribute, value);
  }
  return element;
}

function generateDom(
  root: RenderRoot<RenderText, RenderDecoration>
): [HTMLElement, Set<string>] {
  const languages = new Set<string>();
  if (root.language) {
    languages.add(root.language);
  }
  const { tagName = "span", attributes = [] } = root.data;
  const element = document.createElement(tagName);
  for (const [attribute, value] of attributes) {
    element.setAttribute(attribute, value);
  }
  element.classList.add("dm-box", `dm-${root.id}`, `language-${root.language}`);
  for (const text of root.content.text.values()) {
    element.append(generateText(text));
  }
  for (const decorations of root.content.decorations.values()) {
    element.append(generateDecoration(decorations));
  }
  for (const box of root.content.boxes.values()) {
    const [dom, boxLanguages] = generateDom(box);
    element.append(dom);
    for (const boxLanguage of boxLanguages) {
      languages.add(boxLanguage);
    }
  }
  return [element, languages];
}

export function toDom(
  renderData: RenderData<RenderText, RenderDecoration>
): [Wrapper: HTMLElement, MaxWidth: number, MaxHeight: number] {
  const wrapper = document.createElement("div");
  const code = document.createElement("pre");
  code.className = "dm-code";
  const id = nextId("dom", "container");
  wrapper.className = `dm dm-${id}`;
  const [dom, languages] = generateDom(renderData.objects);
  code.append(dom);
  const style = generateStyle(renderData.frames, languages, `.dm-${id}`);
  wrapper.append(code, style);
  return [wrapper, renderData.maxWidth, renderData.maxHeight];
}
