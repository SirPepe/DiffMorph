// This module implements a very non-smart tokenizer that chops code into small
// pieces. It has to be non-smart to be useful for every conceivable computer
// language. It returns its result as a nested structure but also joins all text
// tokens (the _actual_ content) in a doubly-linked list. Note that the tokens
// all have relative positions and can be nested inside boxes of arbitrary
// depth.

import { Code, CodeContainer, Box, TextToken, Decoration } from "../types";
import { getFirstTextToken, getLastTextToken } from "./util";

const ONLY_WHITESPACE_RE = /^\s+$/;
const LINE_BREAK_RE = /[\r\n]/;

function splitText(text: string): string[] {
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
}

function measureWhitespace (
  text: string
): { breaks: number; length: number } {
  const lines = text.split(LINE_BREAK_RE);
  return {
    breaks: lines.length - 1,
    length: Math.max(...lines.map((token) => token.length)),
  };
}

type TokenizerResult<T> = {
  tokens: T[];
  maxX: number;
  maxY: number;
  lastX: number;
};

function tokenizeText (
  text: string,
  x: number,
  y: number,
  firstLineIndent: number,
  prev: TextToken | undefined,
  parent: Box<TextToken | Decoration>
): TokenizerResult<TextToken> {
  let maxX = x;
  let minY = y;
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
      const token: TextToken = {
        kind: "TEXT",
        x: (y === minY) ? x : x - firstLineIndent,
        y,
        prev,
        next: undefined,
        text: part,
        size: part.length,
        parent,
      };
      if (tokens.length > 0) {
        tokens[tokens.length - 1].next = token;
      }
      tokens.push(token);
      prev = token;
      x += part.length;
    }
    if (x > maxX) {
      maxX = x;
    }
  }
  return {
    tokens,
    maxX,
    maxY: y,
    lastX: x,
  };
};

function tokenizeContainer(
  container: CodeContainer,
  x: number,
  y: number,
  prev: TextToken | undefined,
  parent: Box<TextToken | Decoration> | undefined
): TokenizerResult<Box<TextToken | Decoration>> {
  const box: Box<TextToken | Decoration> = {
    kind: "BOX",
    x,
    y,
    width: 0, // will be updated in a few lines
    height: 0, // will be updated in a few lines
    id: container.id,
    hash: container.hash,
    data: container.data,
    language: container.language || parent?.language,
    tokens: [], // will be updated in a few lines
    parent,
  };
  const { tokens, maxX, maxY, lastX } = tokenizeCodes(
    container.content,
    0,
    0,
    x,
    prev,
    box,
  );
  box.width = maxX;
  box.height = maxY + 1;
  box.tokens = tokens;
  return { tokens: [box], maxX, maxY, lastX };
};

function tokenizeDecoration(
  container: CodeContainer,
  x: number,
  y: number,
  prev: TextToken | undefined,
  parent: Box<TextToken | Decoration>
): TokenizerResult<(TextToken | Decoration | Box<TextToken | Decoration>)> {
  const { tokens, maxX, maxY, lastX } = tokenizeCodes(
    container.content,
    x,
    y,
    0,
    prev,
    parent,
  );
  const decoration: Decoration = {
    x,
    y,
    kind: "DECO",
    id: container.id,
    hash: container.hash,
    data: container.data,
    endX: lastX,
    endY: maxY,
  };
  return {
    maxX,
    maxY,
    lastX,
    tokens: [...tokens, decoration],
  }
};

function tokenizeCodes(
  codes: Code[],
  x: number,
  y: number,
  firstLineIndent: number,
  prev: TextToken | undefined,
  parent: Box<TextToken | Decoration>,
): TokenizerResult<TextToken | Decoration | Box<TextToken | Decoration>> {
  let maxX = x;
  const tokens: (TextToken | Decoration | Box<TextToken | Decoration>)[] = [];
  for (const code of codes) {
    if (typeof code === "string") {
      const result = tokenizeText(code, x, y, firstLineIndent, prev, parent);
      if (prev) {
        prev.next = result.tokens[0];
      }
      prev = result.tokens[result.tokens.length - 1];
      tokens.push(...result.tokens);
      if (result.maxX > maxX) {
        maxX = result.maxX;
      }
      x = result.lastX;
      y = result.maxY;
    } else {
      const result = (code.isDecoration)
        ? tokenizeDecoration(code, x, y, prev, parent)
        : tokenizeContainer(code, x, y, prev, parent)
      if (prev) {
        prev.next = getFirstTextToken(result.tokens);
      }
      prev = getLastTextToken(result.tokens);
      tokens.push(...result.tokens);
      if (x + result.maxX > maxX) {
        maxX = x + result.maxX;
      }
      x = result.lastX;
      y += result.maxY;
    }
  }
  return {
    tokens,
    maxX,
    maxY: y,
    lastX: x,
  };
};

export function tokenize(root: CodeContainer): Box<TextToken | Decoration> {
  return tokenizeContainer(root, 0, 0, undefined, undefined).tokens[0];
}
