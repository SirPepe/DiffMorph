// This module implements a very non-smart tokenizer that chops code into small
// pieces. It has to be non-smart to be useful for every conceivable computer
// language. It returns its result as a nested structure but also joins all text
// tokens (the _actual_ content) in a doubly-linked list. Note that the tokens
// all have absolute positions and can be nested inside boxes of arbitrary
// depth.

import {
  Code,
  CodeContainer,
  BoxToken,
  TextToken,
  HighlightToken,
  isTextToken,
} from "../types";

const ONLY_WHITESPACE_RE = /^\s+$/;
const LINE_BREAK_RE = /[\r\n]/;

const isHighlightBox = (token: CodeContainer): boolean =>
  token.meta.isHighlight;

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

type TokenizerResult<T extends TextToken | BoxToken> = {
  lastX: number;
  lastY: number;
  tokens: T[];
  highlights: HighlightToken[];
};

const tokenizeText = (
  text: string,
  x: number,
  y: number,
  prev: TextToken | undefined
): TokenizerResult<TextToken> => {
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
      const token = { x, y, prev, next: undefined, text: part };
      if (tokens.length > 0) {
        tokens[tokens.length - 1].next = token;
      }
      tokens.push(token);
      prev = token;
      x += part.length;
    }
  }
  return {
    lastX: x,
    lastY: y,
    tokens,
    highlights: [],
  };
};

const tokenizeContainer = (
  container: CodeContainer,
  x: number,
  y: number,
  prev: TextToken | undefined
): TokenizerResult<BoxToken> => {
  const { tokens, highlights, lastX, lastY } = tokenizeCode(
    container.content,
    x,
    y,
    prev
  );
  return {
    lastX,
    lastY,
    tokens: [
      {
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
  prev: TextToken | undefined
): TokenizerResult<TextToken | BoxToken> => {
  const tokens: (BoxToken | TextToken)[] = [];
  const highlights: HighlightToken[] = [];
  for (const code of codes) {
    if (typeof code === "string") {
      const textResult = tokenizeText(code, x, y, prev);
      if (prev) {
        prev.next = textResult.tokens[0];
      }
      prev = textResult.tokens[textResult.tokens.length - 1];
      tokens.push(...textResult.tokens);
      x = textResult.lastX;
      y = textResult.lastY;
    } else {
      if (isHighlightBox(code)) {
        const { hash, meta } = code;
        const highlight = tokenizeCode(code.content, x, y, prev);
        if (prev) {
          prev.next = unwrapFirst(highlight.tokens[0]);
        }
        prev = unwrapLast(highlight.tokens[highlight.tokens.length - 1]);
        tokens.push(...highlight.tokens);
        const span = measureSpan(highlight.tokens);
        highlights.push({
          hash,
          meta,
          start: [span[0][0], span[0][1]],
          end: [span[1][0], span[1][1]],
        });
        x = highlight.lastX;
        y = highlight.lastY;
      } else {
        const boxResult = tokenizeContainer(code, x, y, prev);
        if (prev) {
          prev.next = unwrapFirst(boxResult.tokens[0]);
        }
        prev = unwrapLast(boxResult.tokens[boxResult.tokens.length - 1]);
        tokens.push(...boxResult.tokens);
        highlights.push(...boxResult.highlights);
        x = boxResult.lastX;
        y = boxResult.lastY;
      }
    }
  }
  return { lastX: x, lastY: y, tokens, highlights };
};

export const tokenize = (
  codes: Code[]
): { tokens: (TextToken | BoxToken)[]; highlights: HighlightToken[] } => {
  const { tokens, highlights } = tokenizeCode(codes, 0, 0, undefined);
  return { tokens, highlights };
};
