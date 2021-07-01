// Implements support for both JSON and JSONC. Comments (a feature of JSONC
// only) can be enabled by a flag, which the JSONC definition binds to true.

import { isAdjacent, isNewLine } from "../lib/languages";
import { LanguageTheme, themeColors } from "../language/theme";
import {
  LanguageDefinition,
  LanguageFunction,
  LanguageFunctionResult,
  LanguageTokens,
  TextTokens,
  TypedTokens,
} from "../types";
import { cStyleBlockComment } from "./microsyntax/cStyleBlockComment";
import { cStyleLineComment } from "./microsyntax/cStyleLineComment";

type Flags = {
  comments: boolean;
};

const KEYWORDS = ["null", "true", "false"];
const NUMERIC_RE = /^0b[01]|^0o[0-7]+|^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i;

function defaultState() {
  return {
    key: false,
    string: false,
    arrayDepth: 0,
    objectDepth: 0,
  };
}

function parseNumeric(token: TextTokens): string[] | null {
  if (token.text === "." && token.next && isAdjacent(token, token.next)) {
    const rest = parseNumeric(token.next);
    if (rest) {
      return ["number", ...rest];
    }
  } else if (NUMERIC_RE.test(token.text)) {
    return ["number"];
  }
  return null;
}

function defineJSON(flags: Flags = { comments: false }): LanguageFunction {
  const state = defaultState();

  return (token: LanguageTokens): LanguageFunctionResult => {
    if (flags.comments) {
      if (!state.string && !state.key && cStyleBlockComment.start(token)) {
        return cStyleBlockComment.process();
      }
      if (!state.string && !state.key && cStyleLineComment.start(token)) {
        return cStyleLineComment.process();
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
    const numeric = parseNumeric(token);
    if (numeric) {
      return numeric;
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

function postprocessJSON(token: TypedTokens): boolean {
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
  },
};

export const languageDefinition: LanguageDefinition<Flags> = {
  name: "json",
  theme,
  definitionFactory: defineJSON,
  postprocessor: postprocessJSON,
};
