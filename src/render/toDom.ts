import { createIdGenerator } from "../lib";
import { Keyframe } from "./keyframes";

const nextId = createIdGenerator();

const DEFAULT_STYLES = `
:host { --transition-time: var(--dm-transition-time, 400ms) }
.dm-code { transition: transform var(--transition-time); position: relative }
.dm-token {transition: transform var(--transition-time), opacity var(--transition-time); opacity: 0; position: absolute }
`;

export function toDom(keyframes: Keyframe[]): HTMLElement {
  const wrapper = document.createElement("div");
  const code = document.createElement("pre");
  code.className = "dm-code";
  const id = nextId("dom", "container");
  wrapper.className = `dm dm-${id}`;
  const { style, tokens } = generateContent(keyframes, id);
  code.append(...tokens);
  wrapper.append(code, style);
  return wrapper;
}

function generateContent(
  keyframes: Keyframe[],
  classPrefix: string
): { style: HTMLStyleElement; tokens: HTMLSpanElement[] } {
  const styles = [];
  const tokens = new Map<string, HTMLSpanElement>();
  for (let i = 0; i < keyframes.length; i++) {
    for (const [id, renderToken] of keyframes[i]) {
      if (!tokens.has(id)) {
        const token = document.createElement("span");
        token.className = "dm-token dm-" + id + " " + renderToken.type;
        token.innerText = renderToken.text;
        tokens.set(id, token);
      }
      const selector = `.dm-${classPrefix}.frame${i} .dm-token.dm-${id}`;
      const rules = [
        `transform:translate(${renderToken.x}ch,${renderToken.y}%)`,
      ];
      if (renderToken.visible) {
        rules.push(`opacity:1`);
      }
      styles.push(`${selector}{${rules.join(";")}}`);
    }
  }
  const style = document.createElement("style");
  style.innerHTML = DEFAULT_STYLES + styles.join("\n");
  return {
    style,
    tokens: Array.from(tokens.values()),
  };
}
