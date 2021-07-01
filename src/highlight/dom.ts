import { is } from "@sirpepe/shed";
import { processCode } from "../input/fromDom";
import { InputOptions, withDefaults } from "../input/options";
import { applyLanguage } from "../language/language";
import { DEFAULT_COLOR_PALETTE } from "../language/theme";
import { languages } from "../languages";
import { isBox } from "../lib/box";
import { themeToCss, getLanguage } from "../lib/dom";
import { Box, ContainerData, Decoration, TypedTokens } from "../types";

const DEFAULT_STYLES = `pre {
  --foreground: var(--dm-foreground, ${DEFAULT_COLOR_PALETTE.foreground});
  --background: var(--dm-background, ${DEFAULT_COLOR_PALETTE.background});
  --highlight: var(--dm-highlight, ${DEFAULT_COLOR_PALETTE.highlight});
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
  position: relative;
  color: var(--foreground);
  background-color: var(--background);
  width: 100%;
  height: 100%;
}
.dm-decoration {
  position: absolute;
  z-index: 0;
}`;

export function fromElement(
  input: Element,
  options: InputOptions = {}
): Box<TypedTokens, Decoration<TypedTokens>> {
  const inputConfig = withDefaults(options);
  const tokenized = processCode(input, inputConfig.tabSize);
  if (inputConfig.languageOverride) {
    tokenized.language = inputConfig.languageOverride;
  }
  return applyLanguage(tokenized);
}

export const HIGHLIGHT_STYLES = {};

function renderElement({ tagName, attributes }: ContainerData): HTMLElement {
  if (typeof tagName !== "string") {
    tagName = "span";
  }
  if (!Array.isArray(attributes)) {
    attributes = [];
  }
  const element = document.createElement(tagName);
  for (const [attribute, value] of attributes) {
    element.setAttribute(attribute, value);
  }
  return element;
}

function renderText(input: TypedTokens): HTMLElement {
  const element = document.createElement("span");
  if (typeof input.type === "undefined") {
    console.log(input);
  }
  element.classList.add(...input.type.split(" "), "dm-token");
  element.innerText = input.text;
  return element;
}

function renderDecoration(input: Decoration<unknown>): HTMLElement {
  const element = renderElement(input.data);
  element.classList.add("dm-decoration");
  const rules = [
    `top:${input.x}ch`,
    `left: calc(${input.y} * var(--line-height)`,
    `width:${input.width}ch`,
    `height:calc(${input.height} * var(--line-height))`,
  ];
  element.setAttribute("style", rules.join(";"));
  return element;
}

function renderBox(
  input: Box<TypedTokens, Decoration<TypedTokens>>
): HTMLElement {
  const element = renderElement(input.data);
  element.classList.add("dm-box", `language-${input.language}`);
  for (const decoration of input.decorations) {
    element.append(renderDecoration(decoration));
  }
  for (let i = 0; i < input.content.length; i++) {
    const curr = input.content[i];
    const prev = input.content[i - 1];
    if (prev) {
      const deltaX = curr.x - (prev.x + prev.width);
      if (deltaX > 0) {
        element.append(document.createTextNode(" ".repeat(deltaX)));
      }
      const deltaY = curr.y - prev.y;
      if (deltaY > 0) {
        element.append(
          document.createTextNode("\n".repeat(deltaY)),
          document.createTextNode(" ".repeat(curr.x))
        );
      }
    }
    if (isBox(curr)) {
      element.append(renderBox(curr));
    } else {
      element.append(renderText(curr));
    }
  }
  return element;
}

function getDefaultStyles(langs: Iterable<string>): string {
  let css = DEFAULT_STYLES;
  for (const lang of langs) {
    if (lang in languages) {
      css += themeToCss(`.language-${lang}`, languages[lang].theme);
    }
  }
  return css;
}

export function toHighlight(
  input: Box<TypedTokens, Decoration<TypedTokens>>
): [HTMLElement, HTMLStyleElement] {
  const root = renderBox(input);
  const languages = new Set(
    [
      input.language,
      ...Array.from(root.querySelectorAll(`[class*=language-]`), (element) =>
        getLanguage(element.className)
      ),
    ].filter(is)
  );
  const styles = document.createElement("style");
  styles.innerHTML = getDefaultStyles(languages);
  return [root, styles];
}
