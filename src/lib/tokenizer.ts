// This module implements a very non-smart tokenizer that chops code into small
// pieces. It has to be non-smart to be useful for every conceivable computer
// language. It returns its result as a nested structure but also joins all text
// tokens (the _actual_ content) in a doubly-linked list. Note that all tokens
// use absolute positions and can be nested inside boxes of arbitrary depth.

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

function measureSpacesAndTabs(
  text: string,
  tabSize: number,
): number {
  let size = 0;
  for (const char of text) {
    if (char === " ") {
      size += 1;
    } else if  (char === "\t") {
      size += tabSize;
    } else {
      throw new Error(`Encountered "${char}" in measureSpacesAndTabs!`);
    }
  }
  return size;
}

function measureWhitespace(
  text: string,
  tabSize: number,
): { breaks: number; length: number } {
  const lines = text.split(LINE_BREAK_RE);
  return {
    breaks: lines.length - 1,
    length: Math.max(
      ...lines.map((token) => measureSpacesAndTabs(token, tabSize))
    ),
  };
}

type TokenizerResult<T, D> = {
  content: T[];
  decorations: D[];
  maxX: number; // maximum x span of the tokenized content
  maxY: number; // maximum y span of the tokenized content
  lastX: number; // final x offset when done tokenizing
  lastY: number; // final y offsets when done tokenizing
};

/* eslint-disable */
type FullTokenizerResult = TokenizerResult<
  TextToken | Box<TextToken, Decoration<TextToken>>,
  Decoration<TextToken>
>;
/* eslint-enable */

function tokenizeText(
  text: string,
  x: number,
  y: number,
  prev: TextToken | undefined,
  parent: Box<TextToken, Decoration<TextToken>>,
  tabSize: number
): TokenizerResult<TextToken, never> {
  let maxX = x;
  let maxY = y;
  const parts = splitText(text);
  const content: TextToken[] = [];
  for (const part of parts) {
    if (ONLY_WHITESPACE_RE.test(part)) {
      const { breaks, length } = measureWhitespace(part, tabSize);
      if (breaks > 0) {
        y += breaks;
        x = length;
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
      if (content.length > 0) {
        content[content.length - 1].next = token;
      }
      content.push(token);
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
    content,
    decorations: [],
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
  parent: Box<TextToken, Decoration<TextToken>> | undefined,
  tabSize: number
): TokenizerResult<Box<TextToken, Decoration<TextToken>>, never> {
  const box: Box<TextToken, Decoration<TextToken>> = {
    kind: "BOX",
    x,
    y,
    width: 0, // will be updated in a few lines
    height: 0, // will be updated in a few lines
    id: container.id,
    hash: container.hash,
    data: container.data,
    language: container.language || parent?.language,
    content: [], // will be updated in a few lines
    decorations: [], // will be updated in a few lines
    parent,
  };
  const result = tokenizeCodes(container.content, x, y, prev, box, tabSize);
  box.width = result.maxX - x;
  box.height = result.maxY - y + 1;
  box.content = result.content;
  box.decorations = result.decorations;
  return {
    content: [box],
    decorations: [],
    maxX: result.maxX,
    maxY: result.maxY,
    lastX: result.lastX,
    lastY: result.lastY,
  };
}

function tokenizeDecoration(
  container: CodeContainer,
  x: number,
  y: number,
  prev: TextToken | undefined,
  parent: Box<TextToken, Decoration<TextToken>>,
  tabSize: number
): FullTokenizerResult {
  const result = tokenizeCodes(container.content, x, y, prev, parent, tabSize);
  const width = result.maxX - x;
  const height = result.maxY - y + 1;
  const content = result.content;
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
    content: [...content],
    decorations: [decoration],
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
  prev: TextToken | undefined,
  parent: Box<TextToken, Decoration<TextToken>>,
  tabSize: number
): FullTokenizerResult {
  let maxX = x;
  let maxY = y;
  const content = [];
  const decorations = [];
  for (const code of codes) {
    if (typeof code === "string") {
      const result = tokenizeText(code, x, y, prev, parent, tabSize);
      if (prev) {
        prev.next = result.content[0];
      }
      prev = result.content[result.content.length - 1];
      content.push(...result.content);
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
        ? tokenizeDecoration(code, x, y, prev, parent, tabSize)
        : tokenizeContainer(code, x, y, prev, parent, tabSize);
      if (prev) {
        prev.next = getFirstTextToken(result.content);
      }
      prev = getLastTextToken(result.content);
      content.push(...result.content);
      decorations.push(...result.decorations);
      if (result.maxX > maxX) {
        maxX = result.maxX;
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
    content,
    decorations,
    maxX,
    maxY,
    lastX: x,
    lastY: y,
  };
}

export function tokenize(
  root: CodeContainer,
  tabSize: number
): Box<TextToken, Decoration<TextToken>> {
  return tokenizeContainer(
    root,
    0,
    0,
    undefined,
    undefined,
    tabSize
  ).content[0];
}
