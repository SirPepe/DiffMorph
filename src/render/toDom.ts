import { createIdGenerator } from "../lib";
import { Keyframe } from "./keyframes";

const nextId = createIdGenerator();

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
        token.className = "dm-token " + id + " " + renderToken.type;
        token.innerText = renderToken.text;
        tokens.set(id, token);
      }
      const selector = `.dm-${classPrefix}.frame${i} .dm-token.${id}`;
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
  style.innerHTML = styles.join("\n");
  return {
    style,
    tokens: Array.from(tokens.values()),
  };
}
