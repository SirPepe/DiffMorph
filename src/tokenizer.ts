import { Code, CodeContainer, TextBox, TextToken } from "./types";

const ONLY_WHITESPACE_RE = /^\s+$/;
const LINE_BREAK_RE = /[\r\n]/;

const splitText = (text: string): string[] => {
  const tokens = [];
  let currToken = "";
  for (const char of text) {
    if (char.match(/\w/)) {
      currToken += char;
      continue;
    }
    if (char.match(/\W/)) {
      if (currToken !== "") {
        tokens.push(currToken);
        currToken = "";
      }
      tokens.push(char);
      continue;
    }
  }
  if (currToken !== "") {
    tokens.push(currToken);
  }
  return tokens;
};

const measureWhitespace = (
  text: string
): { breaks: number; length: number } => {
  const lines = text.split(LINE_BREAK_RE);
  return {
    breaks: lines.length - 1,
    length: Math.max(...lines.map((token) => token.length)),
  };
};

const tokenizeText = (
  text: string,
  x: number,
  y: number
): { lastX: number; lastY: number; tokens: TextToken[] } => {
  const parts = splitText(text);
  const tokens: TextToken[] = [];
  for (const part of parts) {
    if (ONLY_WHITESPACE_RE.test(part)) {
      const { breaks, length } = measureWhitespace(part);
      if (breaks > 0) {
        y += breaks;
        x = length;
      } else {
        x += length;
      }
    } else {
      tokens.push({
        x,
        y,
        text: part,
      });
      x += part.length;
    }
  }
  return { tokens, lastX: x, lastY: y };
};

const tokenizeContainer = (
  container: CodeContainer,
  x: number,
  y: number
): { box: TextBox; lastX: number; lastY: number } => {
  const { content, lastX, lastY } = tokenizeCode(container.content, 0, 0);
  return {
    box: {
      x,
      y,
      tagName: container.tagName,
      attributes: container.attributes,
      content,
    },
    lastX: lastY !== y ? lastX : lastX + x,
    lastY: lastY + y,
  };
};

export const tokenizeCode = (
  codes: Code[],
  x: number,
  y: number
): { lastX: number; lastY: number; content: (TextToken | TextBox)[] } => {
  let lastX = x;
  let lastY = y;
  const content: (TextBox | TextToken)[] = [];
  for (const code of codes) {
    if (typeof code === "string") {
      const text = tokenizeText(code, lastX, lastY);
      content.push(...text.tokens);
      lastX = text.lastX;
      lastY = text.lastY;
    } else {
      const box = tokenizeContainer(code, lastX, lastY);
      content.push(box.box);
      lastX = box.lastX;
      lastY = box.lastY;
    }
  }
  return { lastX, lastY, content };
};
