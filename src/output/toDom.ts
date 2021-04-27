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

const nextId = createIdGenerator();

const DEFAULT_STYLES = `
.dm-code {
  transition: transform var(--dm-transition-time, 500ms);
  position: relative;
  --line-height: var(--dm-line-height, 2.5ch);
  --string: var(--dm-string, hsl(340, 95%, 38%));
  --number: var(--dm-number, hsl(170, 100%, 25%));
  --comment: var(--dm-comment, hsl(0, 0%, 50%));
  --global: var(--dm-global, hsl(215, 100%, 40%));
  --type: var(--dm-type, hsl(207, 75%, 25%));
  --tag: var(--dm-tag, hsl(185, 100%, 17.5%));
  --value: var(--dm-value, hsl(135, 100%, 28%));
  --literal: var(--dm-literal, hsl(280, 70%, 50%));
  --punctuation: var(--dm-punctuation, hsl(0, 0%, 25%));
}
.dm-token, .dm-decoration, .dm-box {
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
}`;

function generateTextCss(
  { id, x, y, isVisible }: DecorationPosition,
  rootSelector: string,
  frameIdx: number
): string[] {
  const styles = [];
  const selector = `${rootSelector}.frame${frameIdx} .dm-token.dm-${id}`;
  const rules = [`transform:translate(${x}ch, calc(${y} * var(--line-height)))`];
  if (isVisible) {
    rules.push(`opacity:1`);
  }
  styles.push(`${selector}{${rules.join(";")}}`);
  return styles;
}

function generateDecorationCss(
  { id, x, y, width, height, isVisible }: DecorationPosition,
  rootSelector: string,
  frameIdx: number
): string[] {
  const styles = [];
  const selector = `${rootSelector}.frame${frameIdx} .dm-decoration.dm-${id}`;
  const rules = [
    `transform:translate(${x}ch,calc(${y} * var(--line-height)))`,
    `width:${width}ch`,
    `height:calc(${height} * var(--line-height))`,
  ];
  if (isVisible) {
    rules.push(`opacity:1`);
  }
  styles.push(`${selector}{${rules.join(";")}}`);
  return styles;
}

function generateBoxCss(
  { id, x, y, width, height, isVisible, frame }: RenderPositions,
  rootSelector: string,
  frameIdx: number
): string[] {
  const styles = [];
  const selector = `${rootSelector}.frame${frameIdx} .dm-box.dm-${id}`;
  const rules = [
    `transform:translate(${x}ch,calc(${y} * var(--line-height)))`,
    `width:${width}ch`,
    `height:calc(${height} * var(--line-height))`,
  ];
  if (isVisible) {
    rules.push(`opacity:1`);
  }
  styles.push(`${selector}{${rules.join(";")}}`);
  for (const position of frame.text.values()) {
    styles.push(...generateTextCss(position, rootSelector, frameIdx));
  }
  for (const position of frame.decorations.values()) {
    styles.push(...generateDecorationCss(position, rootSelector, frameIdx));
  }
  for (const position of frame.boxes.values()) {
    styles.push(...generateBoxCss(position, rootSelector, frameIdx));
  }
  return styles;
}

function themeToCss(
  prefix: string,
  theme: Record<string, Record<string, string>>
): string {
  return Object.entries(theme).map(([type, props]) => {
    const selector = `${prefix} .` + type.split(/\s+/).join(".");
    const declarations = Object.entries(props).map(([property, value]) => {
      return `${property}:${value}`;
    }).join(";");
    return `${selector}{${declarations}}`;
  }).join("\n");
}

function getDefaultStyles(langs: Set<string>): string {
  let css = DEFAULT_STYLES;
  for (const lang of langs) {
    if (lang in languages) {
      css += themeToCss(
        `.dm-box.language-${lang}`,
        languages[lang].theme)
    }
  }
  return css;
}

function generateStyle(
  rootFrames: Map<number, RenderPositions>,
  languages: Set<string>,
  classPrefix: string
): HTMLStyleElement {
  const styles = [];
  for (const [frameIdx, rootFrame] of rootFrames) {
    styles.push(...generateBoxCss(rootFrame, classPrefix, frameIdx));
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

function generateDom(root: RenderRoot): [HTMLElement, Set<string>] {
  const languages = new Set<string>();
  if (root.language) {
    languages.add(root.language);
  }
  const { tagName = "span", attributes = [] } = root.data;
  const element = document.createElement(tagName);
  element.className = `dm-box dm-${root.id} language-${root.language}`;
  for (const [attribute, value] of attributes) {
    element.setAttribute(attribute, value);
  }
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
  renderData: RenderData
): [Wrapper: HTMLElement, MaxWidth: number, MaxHeight: number] {
  const wrapper = document.createElement("div");
  const code = document.createElement("pre");
  code.className = "dm-code";
  const id = nextId("dom", "container");
  wrapper.className = `dm dm-${id}`;
  const [dom, languages] = generateDom(renderData.objects);
  code.append(dom)
  const style = generateStyle(renderData.frames, languages, `.dm-${id}`);
  wrapper.append(code, style);
  return [wrapper, renderData.maxWidth, renderData.maxHeight];
}
