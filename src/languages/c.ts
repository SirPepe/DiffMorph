import { Stack, isAdjacent } from "../lib/languages";
import { LanguageTheme, themeColors } from "../language/theme";
import {
  LanguageDefinition,
  LanguageFunction,
  LanguageFunctionResult,
  LanguageTokens,
  TypedTokens,
} from "../types";
import { cStyleBlockComment } from "./microsyntax/cStyleBlockComment";
import { cStyleLineComment } from "./microsyntax/cStyleLineComment";

const KEYWORDS = new Set([
  "auto",
  "_Bool",
  "break",
  "case",
  "char",
  "_Complex",
  "const",
  "continue",
  "default",
  "do",
  "double",
  "else",
  "enum",
  "extern",
  "float",
  "for",
  "goto",
  "if",
  "_Imaginary",
  "inline",
  "int",
  "long",
  "register",
  "restrict",
  "return",
  "short",
  "signed",
  "sizeof",
  "static",
  "struct",
  "switch",
  "typedef",
  "union",
  "unsigned",
  "void",
  "volatile",
  "while",
]);

type CurlyType = "curly" | "enum" | "block";

type State = {
  string: "'" | '"' | false;
  curlyStack: Stack<CurlyType>;
};

function defaultState(): State {
  return {
    string: false,
    curlyStack: new Stack<CurlyType>("curly"),
  };
}

function defineC(): LanguageFunction {
  const state = defaultState();

  return (token: LanguageTokens): LanguageFunctionResult => {
    if (!state.string && cStyleBlockComment.start(token)) {
      return cStyleBlockComment.process();
    }
    if (!state.string && cStyleLineComment.start(token)) {
      return cStyleLineComment.process();
    }

    // handle entering and exiting strings/chars
    if (
      (token.text === '"' || token.text === "'") &&
      token?.prev?.text !== "\\"
    ) {
      // exit string state
      if (state.string === token.text) {
        state.string = false;
        return "string";
      } else {
        if (!state.string) {
          state.string = token.text;
        }
        return "string";
      }
    }

    // is token a keyword?
    if (KEYWORDS.has(token.text)) {
      return "keyword";
    }

    if ([".", ",", ":", ";"].includes(token.text)) {
      return "punctuation";
    }

    // no special token
    return "token";
  };
}

function postprocessC(token: TypedTokens): boolean {
  if (token.type.startsWith("comment")) {
    return isAdjacent(token, token.prev);
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

export const languageDefinition: LanguageDefinition<Record<string, never>> = {
  name: "c",
  theme,
  definitionFactory: defineC,
  postprocessor: postprocessC,
};
