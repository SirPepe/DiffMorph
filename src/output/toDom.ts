import {
  DecorationPosition,
  RenderData,
  RenderDecoration,
  RenderPositions,
  RenderRoot,
  RenderText,
} from "../types";
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
}
/* JSON and JSONC */
.dm-box.language-json .dm-token.number,
.dm-box.language-jsonc .dm-token.number {
  color: var(--number);
}
.dm-box.language-json .dm-token.string,
.dm-box.language-jsonc .dm-token.string {
  color: var(--string);
}
.dm-box.language-json .dm-token.value,
.dm-box.language-jsonc .dm-token.value {
  color: var(--value);
}
.dm-box.language-json .dm-token[class*="keyword-"],
.dm-box.language-jsonc .dm-token[class*="keyword-"] {
  color: var(--literal);
}
.dm-box.language-json .dm-token[class*="punctuation"],
.dm-box.language-jsonc .dm-token[class*="punctuation"] {
  color: var(--punctuation);
}
.dm-box.language-json .dm-token[class*="comment-"],
.dm-box.language-jsonc .dm-token[class*="comment-"] {
  color: var(--comment);
  font-style: italic;
}
/* TOML */
.dm-box.language-toml .dm-token.number,
.dm-box.language-toml .dm-token.keyword {
  color: var(--number);
}
.dm-box.language-toml .dm-token.string-key {
  color: var(--string);
}
.dm-box.language-toml .dm-token.value {
  color: var(--value);
}
.dm-box.language-toml .dm-token[class*="literal-"] {
  color: var(--literal);
  font-weight: bold;
}
.dm-box.language-toml .dm-token[class*="punctuation"] {
  color: var(--punctuation);
}
.dm-box.language-toml .dm-token[class*="operator"] {
  color: var(--type);
}
.dm-box.language-toml .dm-token.comment {
  color: var(--comment);
  font-style: italic;
}
`;

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

function generateStyle(
  rootFrames: RenderPositions[],
  classPrefix: string
): HTMLStyleElement {
  const styles = [];
  for (let frameIdx = 0; frameIdx < rootFrames.length; frameIdx++) {
    const { frame } = rootFrames[frameIdx];
    styles.push(...generateBoxCss(rootFrames[frameIdx], classPrefix, frameIdx));
    for (const position of frame.text.values()) {
      styles.push(...generateTextCss(position, classPrefix, frameIdx));
    }
    for (const position of frame.decorations.values()) {
      styles.push(...generateDecorationCss(position, classPrefix, frameIdx));
    }
    for (const position of frame.boxes.values()) {
      styles.push(...generateBoxCss(position, classPrefix, frameIdx));
    }
  }
  const css = DEFAULT_STYLES + styles.join("\n");
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

function generateDom(root: RenderRoot): HTMLElement {
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
    element.append(generateDom(box));
  }
  return element;
}

export function toDom(
  renderData: RenderData
): [Wrapper: HTMLElement, MaxWidth: number, MaxHeight: number] {
  const wrapper = document.createElement("div");
  const code = document.createElement("pre");
  code.className = "dm-code";
  const id = nextId("dom", "container");
  wrapper.className = `dm dm-${id}`;
  code.append(generateDom(renderData.objects));
  wrapper.append(code, generateStyle(renderData.frames, `.dm-${id}`));
  return [wrapper, renderData.maxWidth, renderData.maxHeight];
}
