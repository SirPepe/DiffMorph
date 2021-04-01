import { createIdGenerator } from "../lib/util";
import { Keyframe } from "../lib/keyframes";

const nextId = createIdGenerator();

const DEFAULT_STYLES = `
.dm-code {
  transition: transform var(--dm-transition-time, 400ms);
  position: relative
}
.dm-token {
  transition: transform var(--dm-transition-time, 400ms),
              opacity var(--dm-transition-time, 400ms);
  opacity: 0;
  position: absolute;
}`;

function generateContent(
  keyframes: Keyframe[],
  classPrefix: string
): { style: HTMLStyleElement; tokens: HTMLSpanElement[] } {
  const styles = [];
  const tokens = new Map<string, HTMLSpanElement>();
  for (let i = 0; i < keyframes.length; i++) {
    for (const [id, renderToken] of keyframes[i].tokens) {
      if (!tokens.has(id)) {
        const token = document.createElement("span");
        token.className = "dm-token dm-" + id + " " + renderToken.type;
        token.innerText = renderToken.text;
        tokens.set(id, token);
      }
      const selector = `.dm-${classPrefix}.frame${i} .dm-token.dm-${id}`;
      const rules = [
        `transform:translate(${renderToken.x}ch,${renderToken.y * 100}%)`,
      ];
      if (renderToken.isVisible) {
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

export function toDom(
  keyframes: Keyframe[]
): [Wrapper: HTMLElement, MaxWidth: number, MaxHeight: number] {
  const wrapper = document.createElement("div");
  const code = document.createElement("pre");
  code.className = "dm-code";
  const id = nextId("dom", "container");
  wrapper.className = `dm dm-${id}`;
  const { style, tokens } = generateContent(keyframes, id);
  const maxWidth = Math.max(...keyframes.map(({ width }) => width));
  const maxHeight = Math.max(...keyframes.map(({ height }) => height));
  code.append(...tokens);
  wrapper.append(code, style);
  return [wrapper, maxWidth, maxHeight];
}
