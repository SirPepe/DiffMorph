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
  transition: transform var(--dm-transition-time, 400ms);
  position: relative
}
.dm-token, .dm-decoration {
  transition: transform var(--dm-transition-time, 400ms),
              opacity var(--dm-transition-time, 400ms);
  opacity: 0;
  position: absolute;
}`;

function generateTextCss(
  { id, x, y, width, height, isVisible }: DecorationPosition,
  rootSelector: string,
  frameIdx: number
): string[] {
  const styles = [];
  const selector = `${rootSelector}.frame${frameIdx} .dm-${id}`;
  const rules = [
    `transform:translate(${x}ch,${y * 100}%)`,
    `width:${width}`,
    `height:${height}`,
  ];
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
  const selector = `${rootSelector}.frame${frameIdx} .dm-${id}`;
  const rules = [
    `transform:translate(${x}ch,${y * 100}%)`,
    `width:${width}`,
    `height:${height}`,
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
  const selector = `${rootSelector}.frame${frameIdx} .dm-${id}`;
  const rules = [
    `transform:translate(${x}ch,${y * 100}%)`,
    `width:${width}`,
    `height:${height}`,
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
  element.className = "dm-token dm-" + id + " " + type;
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

function generateDom(renderRoot: RenderRoot): HTMLElement {
  const { tagName = "span", attributes = [] } = renderRoot.data;
  const element = document.createElement(tagName);
  element.className = `dm-${renderRoot.id} language-${renderRoot.language}`;
  for (const [attribute, value] of attributes) {
    element.setAttribute(attribute, value);
  }
  for (const text of renderRoot.content.text.values()) {
    element.append(generateText(text));
  }
  for (const decorations of renderRoot.content.decorations.values()) {
    element.append(generateDecoration(decorations));
  }
  for (const box of renderRoot.content.boxes.values()) {
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
