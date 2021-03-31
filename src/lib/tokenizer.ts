// This module implements a very non-smart tokenizer that chops code into small
// pieces. It has to be non-smart to be useful for every conceivable computer
// language. It returns its result as a nested structure but also joins all text
// tokens (the _actual_ content) in a doubly-linked list. Note that the tokens
// all have absolute positions and can be nested inside boxes of arbitrary
// depth.

import { Code, CodeContainer, Box, TextToken, Highlight } from "../types";
import { getFirstTextToken, getLastTextToken } from "./util";

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

type TokenizerResult<T> = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  tokens: T[];
};

const tokenizeText = (
  text: string,
  fromX: number,
  fromY: number,
  prev: TextToken | undefined,
  parent: Box<TextToken | Highlight>
): TokenizerResult<TextToken> => {
  let toX = fromX;
  let toY = fromY;
  const parts = splitText(text);
  const tokens: TextToken[] = [];
  for (const part of parts) {
    if (ONLY_WHITESPACE_RE.test(part)) {
      const { breaks, length } = measureWhitespace(part);
      if (breaks > 0) {
        toY += breaks;
        toX = length;
      } else {
        toX += length;
      }
    } else {
      const token: TextToken = {
        x: toX,
        y: toY,
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
      toX += part.length;
    }
  }
  return {
    fromX,
    fromY,
    toX,
    toY,
    tokens,
  };
};

const tokenizeContainer = (
  container: CodeContainer,
  x: number,
  y: number,
  prev: TextToken | undefined,
  parent: Box<TextToken | Highlight> | undefined
): TokenizerResult<Box<TextToken | Highlight>> => {
  const box: Box<TextToken | Highlight> = {
    type: "BOX",
    id: container.id,
    hash: container.hash,
    meta: container.meta,
    language: container.language || parent?.language,
    tokens: [],
  };
  const { tokens, fromX, fromY, toX, toY } = tokenizeCodes(
    container.content,
    box,
    x,
    y,
    prev
  );
  box.tokens = tokens;
  return {
    fromX,
    fromY,
    toX,
    toY,
    tokens: [box],
  };
};

const tokenizeHighlight = (
  container: CodeContainer,
  x: number,
  y: number,
  prev: TextToken | undefined,
  parent: Box<TextToken | Highlight>
): TokenizerResult<TextToken | Highlight | Box<TextToken | Highlight>> => {
  const { tokens, fromX, fromY, toX, toY } = tokenizeCodes(
    container.content,
    parent,
    x,
    y,
    prev
  );
  const highlight: Highlight = {
    type: "HIGHLIGHT",
    id: container.id,
    hash: container.hash,
    meta: container.meta,
    start: [fromX, fromY],
    end: [toX, toY],
  };
  return {
    fromX,
    fromY,
    toX,
    toY,
    tokens: [...tokens, highlight],
  }
};

const tokenizeCodes = (
  codes: Code[],
  parent: Box<TextToken | Highlight>,
  fromX: number,
  fromY: number,
  prev: TextToken | undefined
): TokenizerResult<TextToken | Highlight | Box<TextToken | Highlight>> => {
  let toX = fromX;
  let toY = fromY;
  const tokens: (TextToken | Highlight | Box<TextToken | Highlight>)[] = [];
  for (const code of codes) {
    if (typeof code === "string") {
      const result = tokenizeText(code, toX, toY, prev, parent);
      if (prev) {
        prev.next = result.tokens[0];
      }
      prev = result.tokens[result.tokens.length - 1];
      tokens.push(...result.tokens);
      toX = result.toX;
      toY = result.toY;
    } else {
      const result = code.isHighlight
        ? tokenizeHighlight(code, toX, toY, prev, parent)
        : tokenizeContainer(code, toX, toY, prev, parent);
      if (prev) {
        prev.next = getFirstTextToken(result.tokens);
      }
      prev = getLastTextToken(result.tokens);
      tokens.push(...result.tokens);
      toX = result.toX;
      toY = result.toY;
    }
  }
  return { fromX, fromY, toX, toY, tokens };
};

export const tokenize = (
  root: CodeContainer
): Box<TextToken | Highlight> => {
  const { tokens } = tokenizeContainer(
    root,
    0,
    0,
    undefined,
    undefined
  );
  return tokens[0];
};
