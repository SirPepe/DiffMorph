// Implements support for both JSON and JSONC. Comments (a feature of JSONC
// only) can be enabled by a flag, which the JSONC definition binds to true.

import { isAdjacent, isNewLine } from "../lib/util";
import { LanguageTheme, themeColors } from "../lib/theme";
import { LanguageDefinition, RawToken, TypedToken } from "../types";

type Flags = {
  comments: boolean;
};

const KEYWORDS = ["null", "true", "false"];
const NUMBER_RE = /^0b[01]|^0o[0-7]+|^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i;

function defaultState() {
  return {
    key: false,
    string: false,
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
        state.string === false &&
        token.text === "/" &&
        token?.prev?.text === "*"
      ) {
        state.blockComment = false;
        return "comment comment-block";
      }

      // enter block comment state
      if (
        state.blockComment === false &&
        state.key === false &&
        state.string === false &&
        token.text === "/" &&
        token?.next?.text === "*"
      ) {
        state.blockComment = true;
        return "comment comment-block";
      }

      // are we in block comment state?
      if (state.blockComment) {
        return "comment comment-block";
      }

      // enter line comment state
      if (
        state.lineComment === false &&
        state.string === false &&
        state.key === false &&
        token.text === "/" &&
        token?.next?.text === "/"
      ) {
        state.lineComment = true;
        return "comment comment-line";
      }

      // in line comment state?
      if (state.lineComment) {
        return "comment comment-line";
      }
    }

    // handle entering and exiting strings (keys and values)
    if (token.text === '"' && token?.prev?.text !== "\\") {
      // exit string state
      if (state.string) {
        state.string = false;
        return "value";
      }
      if (state.key) {
        state.key = false;
        return "string";
      }
      // enter string state
      if (token?.prev?.text === ":") {
        state.string = true;
        return "value";
      } else {
        state.key = true;
        return "string";
      }
    }

    // are we in value state?
    if (state.string === true) {
      // exit state on new line to better handle broken json
      if (token.next && isNewLine(token.next)) {
        state.string = false;
      }
      return "value";
    }

    // are we in string state?
    if (state.key === true) {
      // exit state on new line to better handle broken json
      if (token.next && isNewLine(token.next)) {
        state.string = false;
      }
      return "string";
    }

    // is token a number?
    if (token.text.match(NUMBER_RE)) {
      return "number";
    }

    // is token a keyword?
    if (KEYWORDS.includes(token.text)) {
      return "keyword";
    }

    // Objects and arrays
    if (token.text === "{") {
      return `punctuation object-start-${state.objectDepth++}`;
    }
    if (token.text === "[") {
      return `punctuation array-start-${state.arrayDepth++}`;
    }
    if (token.text === "]") {
      return `punctuation array-end-${--state.arrayDepth}`;
    }
    if (token.text === "}") {
      return `punctuation object-end-${--state.objectDepth}`;
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

const theme: LanguageTheme = {
  number: {
    color: themeColors.number,
  },
  string: {
    color: themeColors.string,
  },
  value: {
    color: themeColors.value,
  },
  keyword: {
    color: themeColors.literal,
  },
  punctuation: {
    color: themeColors.punctuation,
  },
  comment: {
    color: themeColors.comment,
    "font-style": "italic",
  }
};

export const languageDefinition: LanguageDefinition<Flags> = {
  name: "json",
  theme,
  definitionFactory: defineJSON,
  postprocessor: postprocessJSON,
};
