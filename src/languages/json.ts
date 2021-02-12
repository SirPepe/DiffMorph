import { LanguageToken, TypedLanguageToken } from "../types";

const KEYWORDS = ["null", "true", "false"];
const NUMBER_RE = /^0b[01]|^0o[0-7]+|^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i;

const defaultState = () => ({
  key: false,
  stringValue: false,
  lineComment: false,
  blockComment: false,
});

export const languageDefinition = (): ((token: LanguageToken) => string) => {
  const state = defaultState();

  return (token: LanguageToken): string => {
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

    // no special token
    return "token";
  };
};

const gluePredicate = (token: TypedLanguageToken): boolean => {
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
};

export default {
  languageDefinition,
  gluePredicate,
};
