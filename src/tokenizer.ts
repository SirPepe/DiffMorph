// This module implements a very non-smart tokenizer that chops code into small
// pieces. It has to be non-smart to be useful for every conceivable computer
// language.

import {
  Code,
  CodeContainer,
  BoxToken,
  TextToken,
  HighlightToken,
  isTextToken,
} from "./types";

const ONLY_WHITESPACE_RE = /^\s+$/;
const LINE_BREAK_RE = /[\r\n]/;

const isHighlightBox = (token: CodeContainer): boolean =>
  token.meta.tagName === "mark";

const unwrapFirst = (token: TextToken | BoxToken): TextToken => {
  if (isTextToken(token)) {
    return token;
  } else {
    return unwrapFirst(token.tokens[0]);
  }
};

const unwrapLast = (token: TextToken | BoxToken): TextToken => {
  if (isTextToken(token)) {
    return token;
  } else {
    return unwrapFirst(token.tokens[token.tokens.length - 1]);
  }
};

const measureSpan = (
  content: (TextToken | BoxToken)[]
): [start: [number, number], end: [number, number]] => {
  const first = unwrapFirst(content[0]);
  const last = unwrapLast(content[content.length - 1]);
  return [
    [first.x, first.y],
    [last.x + last.text.length, last.y],
  ];
};

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

type TokenizerResult = {
  lastX: number;
  lastY: number;
  tokens: (TextToken | BoxToken)[];
  highlights: HighlightToken[];
};

const tokenizeText = (
  text: string,
  inputX: number,
  inputY: number,
  indent: number
): TokenizerResult => {
  let x = inputX;
  let y = inputY;
  const parts = splitText(text);
  const tokens: TextToken[] = [];
  for (const part of parts) {
    if (ONLY_WHITESPACE_RE.test(part)) {
      const { breaks, length } = measureWhitespace(part);
      if (breaks > 0) {
        y += breaks;
        x = length - indent;
      } else {
        x += length;
      }
    } else {
      tokens.push({ x, y, text: part });
      x += part.length;
    }
  }
  return {
    lastX: y !== inputY ? x + indent : x,
    lastY: y,
    tokens,
    highlights: [],
  };
};

const tokenizeContainer = (
  container: CodeContainer,
  x: number,
  y: number,
  indent: number
): TokenizerResult => {
  const { tokens, highlights, lastX, lastY } = tokenizeCode(
    container.content,
    0,
    0,
    indent + x
  );
  return {
    lastX: lastY !== y ? lastX : lastX + x,
    lastY: lastY + y,
    tokens: [
      {
        x,
        y,
        hash: container.hash,
        meta: container.meta,
        tokens,
      },
    ],
    highlights,
  };
};

const tokenizeCode = (
  codes: Code[],
  x: number,
  y: number,
  indent: number
): TokenizerResult => {
  let lastX = x;
  let lastY = y;
  const tokens: (BoxToken | TextToken)[] = [];
  const highlights: HighlightToken[] = [];
  for (const code of codes) {
    if (typeof code === "string") {
      const textResult = tokenizeText(code, lastX, lastY, indent);
      tokens.push(...textResult.tokens);
      lastX = textResult.lastX;
      lastY = textResult.lastY;
    } else {
      if (isHighlightBox(code)) {
        const { hash, meta } = code;
        const highlight = tokenizeCode(code.content, lastX, lastY, indent);
        tokens.push(...highlight.tokens);
        const span = measureSpan(highlight.tokens);
        highlights.push({
          hash,
          meta,
          start: [span[0][0] + indent, span[0][1]],
          end: [span[1][0] + indent, span[1][1]],
        });
        lastX = highlight.lastX;
        lastY = highlight.lastY;
      } else {
        const boxResult = tokenizeContainer(code, lastX, lastY, indent);
        tokens.push(...boxResult.tokens);
        highlights.push(...boxResult.highlights);
        lastX = boxResult.lastX;
        lastY = boxResult.lastY;
      }
    }
  }
  return { lastX, lastY, tokens, highlights };
};

export const tokenize = (
  codes: Code[]
): { tokens: (TextToken | BoxToken)[]; highlights: HighlightToken[] } => {
  const { tokens, highlights } = tokenizeCode(codes, 0, 0, 0);
  return { tokens, highlights };
};
