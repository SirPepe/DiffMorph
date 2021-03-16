// Implements support for both JSON and JSONC. Comments (a feature of JSONC
// only) can be enabled by a flag, which the JSONC definition binds to true.

import { isAdjacent } from "../lib/util";
import { LanguageDefinition, RawToken, TypedToken } from "../types";

type Flags = {
  comments: boolean;
};

const KEYWORDS = ["null", "true", "false"];
const NUMBER_RE = /^0b[01]|^0o[0-7]+|^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i;

function defaultState() {
  return {
    key: false,
    stringValue: false,
    lineComment: false,
    blockComment: false,
    arrayDepth: 0,
    objectDepth: 0,
  };
}

function defineJSON(
  flags: Flags = { comments: false }
): (token: RawToken) => string {
  const state = defaultState();
  const { comments } = flags;

  return (token: RawToken): string => {
    if (comments) {
      // exit line comment state (on new line)
      if (state.lineComment && token.prev && token.y > token.prev.y) {
        state.lineComment = false;
      }

      // exit block comment state
      if (
        state.blockComment === true &&
        state.key === false &&
        state.stringValue === false &&
        token.text === "/" &&
        token?.prev?.text === "*"
      ) {
        state.blockComment = false;
        return "comment-block";
      }

      // enter block comment state
      if (
        state.blockComment === false &&
        state.key === false &&
        state.stringValue === false &&
        token.text === "/" &&
        token?.next?.text === "*"
      ) {
        state.blockComment = true;
        return "comment-block";
      }

      // are we in block comment state?
      if (state.blockComment) {
        return "comment-block";
      }

      // enter line comment state
      if (
        state.lineComment === false &&
        state.stringValue === false &&
        state.key === false &&
        token.text === "/" &&
        token?.next?.text === "/"
      ) {
        state.lineComment = true;
        return "comment-line";
      }

      // in line comment state?
      if (state.lineComment) {
        return "comment-line";
      }
    }

    // handle entering and exiting strings (keys and values)
    if (token.text === '"' && (!token.prev || token.prev.text !== "\\")) {
      // exit string states
      if (state.stringValue) {
        state.stringValue = false;
        return "value";
      }
      if (state.key) {
        state.key = false;
        return "string";
      }
      // enter string states
      if (token?.prev?.text === ":") {
        state.stringValue = true;
        return "value";
      } else {
        state.key = true;
        return "string";
      }
    }

    // are we in key state?
    if (state.stringValue === true) {
      return "value";
    }

    // are we in string state?
    if (state.key === true) {
      return "string";
    }

    // is token a number?
    if (token.text.match(NUMBER_RE)) {
      return "number";
    }

    // is token a keyword?
    if (KEYWORDS.includes(token.text)) {
      return `keyword-${token.text}`;
    }

    // Objects and arrays
    if (token.text === "{") {
      return `token-object-start-${state.objectDepth++}`;
    }
    if (token.text === "[") {
      return `token-array-start-${state.arrayDepth++}`;
    }
    if (token.text === "]") {
      return `token-array-end-${--state.arrayDepth}`;
    }
    if (token.text === "}") {
      return `token-object-end-${--state.objectDepth}`;
    }

    if (token.text === "," || token.text === ":") {
      return "punctuation";
    }

    // no special token
    return "token";
  };
}

function postprocessJSON(token: TypedToken): boolean {
  if (token.type.startsWith("comment")) {
    return isAdjacent(token, token.prev);
  }
  if (
    token.type !== "token" &&
    token.y === token?.prev?.y &&
    token.type === token?.prev?.type
  ) {
    return true;
  }
  if (
    (token.text === "." && token?.prev?.type === "number") ||
    (token.type === "number" && token?.prev?.text === ".")
  ) {
    return true;
  }
  return false;
}

export const languageDefinition: LanguageDefinition<Flags> = {
  definitionFactory: defineJSON,
  postprocessor: postprocessJSON,
};
