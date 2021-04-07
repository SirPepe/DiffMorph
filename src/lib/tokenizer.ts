// This module implements a very non-smart tokenizer that chops code into small
// pieces. It has to be non-smart to be useful for every conceivable computer
// language. It returns its result as a nested structure but also joins all text
// tokens (the _actual_ content) in a doubly-linked list. Note that the tokens
// all have relative positions and can be nested inside boxes of arbitrary
// depth.

import { Box, Code, CodeContainer, Decoration, TextToken } from "../types";
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

function measureWhitespace(text: string): { breaks: number; length: number } {
  const lines = text.split(LINE_BREAK_RE);
  return {
    breaks: lines.length - 1,
    length: Math.max(...lines.map((token) => token.length)),
  };
}

type TokenizerResult<T> = {
  tokens: T[];
  maxX: number; // maximum x span of the tokenized content
  maxY: number; // maximum y span of the tokenized content
  lastX: number; // final x offset when done tokenizing
  lastY: number; // final y offsets when done tokenizing
};

/* eslint-disable */
type FullTokenizerResult = TokenizerResult<
  TextToken | Decoration<TextToken> | Box<TextToken | Decoration<TextToken>>
>;
/* eslint-enable */

function tokenizeText(
  text: string,
  x: number,
  y: number,
  firstLineIndent: number,
  prev: TextToken | undefined,
  parent: Box<TextToken | Decoration<TextToken>>
): TokenizerResult<TextToken> {
  let maxX = x;
  let maxY = y;
  const parts = splitText(text);
  const tokens: TextToken[] = [];
  for (const part of parts) {
    if (ONLY_WHITESPACE_RE.test(part)) {
      const { breaks, length } = measureWhitespace(part);
      if (breaks > 0) {
        y += breaks;
        x = length - firstLineIndent;
      } else {
        x += length;
      }
    } else {
      const token: TextToken = {
        kind: "TEXT",
        x,
        y,
        prev,
        next: undefined,
        text: part,
        width: part.length,
        height: 1,
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
    if (y > maxY) {
      maxY = y;
    }
  }
  return {
    tokens,
    maxX,
    maxY,
    lastX: x,
    lastY: y,
  };
}

function tokenizeContainer(
  container: CodeContainer,
  x: number,
  y: number,
  prev: TextToken | undefined,
  parent: Box<TextToken | Decoration<TextToken>> | undefined
): TokenizerResult<Box<TextToken | Decoration<TextToken>>> {
  const box: Box<TextToken | Decoration<TextToken>> = {
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
  const result = tokenizeCodes(container.content, 0, 0, x, prev, box);
  box.width = result.maxX;
  box.height = result.maxY + 1;
  box.tokens = result.tokens;
  return {
    tokens: [box],
    maxX: result.maxX,
    maxY: result.maxY,
    lastX: result.lastX + x,
    lastY: result.lastY + y,
  };
}

function tokenizeDecoration(
  container: CodeContainer,
  x: number,
  y: number,
  prev: TextToken | undefined,
  parent: Box<TextToken | Decoration<TextToken>>
): FullTokenizerResult {
  const result = tokenizeCodes(container.content, x, y, 0, prev, parent);
  const width = result.maxX - x;
  const height = result.maxY - y + 1;
  const tokens = result.tokens;
  const decoration: Decoration<TextToken> = {
    x,
    y,
    width,
    height,
    kind: "DECO",
    hash: container.hash,
    data: container.data,
    parent,
  };
  return {
    tokens: [...tokens, decoration],
    maxX: result.maxX,
    maxY: result.maxY,
    lastX: result.lastX,
    lastY: result.lastY,
  };
}

function tokenizeCodes(
  codes: Code[],
  x: number,
  y: number,
  firstLineIndent: number,
  prev: TextToken | undefined,
  parent: Box<TextToken | Decoration<TextToken>>
): FullTokenizerResult {
  let maxX = x;
  let maxY = y;
  const tokens = [];
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
      if (result.maxY > maxY) {
        maxY = result.maxY;
      }
      x = result.lastX;
      y = result.lastY;
    } else {
      const result = code.isDecoration
        ? tokenizeDecoration(code, x, y, prev, parent)
        : tokenizeContainer(code, x, y, prev, parent);
      if (prev) {
        prev.next = getFirstTextToken(result.tokens);
      }
      prev = getLastTextToken(result.tokens);
      tokens.push(...result.tokens);
      if (x + result.maxX > maxX) {
        maxX = x + result.maxX;
      }
      if (result.maxY > maxY) {
        maxY = result.maxY;
      }
      x = result.lastX;
      y = result.lastY;
    }
    if (x > maxX) {
      maxX = x;
    }
    if (y > maxY) {
      maxY = y;
    }
  }
  return {
    tokens,
    maxX,
    maxY,
    lastX: x,
    lastY: y,
  };
}

export function tokenize(
  root: CodeContainer
): Box<TextToken | Decoration<TextToken>> {
  return tokenizeContainer(root, 0, 0, undefined, undefined).tokens[0];
}
