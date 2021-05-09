import { LanguageTheme, themeColors } from "../lib/theme";
import { isAdjacent, lookaheadText } from "../lib/util";
import { LanguageDefinition, RawToken, TypedToken } from "../types";

const KEYWORDS = ["null", "true", "false"];
const NUMBER_RE = /^nan|^inf|^0b[01]|^0o[0-7]+|^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i;

type State = {
  comment: boolean;
  header: boolean;
  key: boolean;
  string: false | "s" | "l" | "ms" | "ml";
  arrayDepth: number;
  tableDepth: number;
  stack: ("a" | "t")[]; // a = array, t = table
}

function defaultState(): State {
  return {
    comment: false,
    header: false,
    key: false,
    string: false,
    arrayDepth: 0,
    tableDepth: 0,
    stack: [],
  };
}

function defineTOML(): (token: RawToken) => string | string[] {
  const state = defaultState();

  return (token: RawToken): string | string[] => {
    // exit comment state on incoming new line
    if (state.comment && token.next && token.next.y > token.y) {
      state.comment = false;
      return "comment";
    }
    // enter comment state
    if (token.text === "#" && !state.key && !state.string) {
      state.comment = true;
      return "comment";
    }
    // in comment state?
    if (state.comment) {
      return "comment";
    }

    // exit header state
    if (state.header && token.text === "]") {
      state.header = false;
      if (token?.next?.text === "]") { // array table header
        return ["header", "header"];
      }
      return "header";
    }
    // enter header state
    if (!state.header && token.x === 0 && token.text === "[") {
      state.header = true;
      return "header";
    }
    // in header state?
    if (state.header) {
      return "header";
    }

    // exit key state on incoming equals sign. Don't check for existing key
    // state as the current token may be a one-token key
    if (token.next?.text === "=") {
      state.key = false;
      return "key";
    }

    // enter key state
    if (!state.key && !state.string) {
      // first key ever
      if (!token.prev) {
        state.key = true;
        return "key";
      }
      // key on a new line outside an array or table
      if (token.prev.y !== token.y && state.stack.length === 0) {
        state.key = true;
        return "key";
      }
      // Key inside an inline table
      if (
        state.stack[state.stack.length - 1] === "t" &&
        (token.prev.text === "{" ||  token.prev.text === ",")
      ) {
        state.key = true;
        return "key";
      }
    }
    // in key state?
    if (state.key) {
      return "key";
    }

    // exit value string states
    if (state.string === "s" && token.text === '"') {
      state.string = false;
      return "value";
    }
    if (state.string === "l" && token.text === "'") {
      state.string = false;
      return "value";
    }
    if (state.string === "ms" && token.text === '"' && lookaheadText(token, ['"', '"'])) {
      state.string = false;
      return ["value", "value", "value"];
    }
    if (state.string === "ml" && token.text === "'" && lookaheadText(token, ["'", "'"])) {
      state.string = false;
      return ["value", "value", "value"];
    }
    // enter value sting states
    if (!state.comment && !state.string) {
      if (token.text === '"') {
        if (lookaheadText(token, ['"', '"'])) {
          state.string = "ms";
          return ["value", "value", "value"];
        }
        state.string = "s";
        return "value";
      }
      if (token.text === "'") {
        if (lookaheadText(token, ["'", "'"])) {
          state.string = "ml";
          return ["value", "value", "value"];
        }
        state.string = "l";
        return "value";
      }
    }
    // in value string state?
    if (state.string) {
      return "value";
    }

    // is token a keyword?
    if (KEYWORDS.includes(token.text)) {
      return "keyword";
    }

    // Objects and arrays
    if (token.text === "{") {
      state.stack.push("t");
      return `punctuation table-start-${state.tableDepth++}`;
    }
    if (token.text === "[") {
      state.stack.push("a");
      return `punctuation array-start-${state.arrayDepth++}`;
    }
    if (token.text === "]") {
      state.stack.pop();
      return `punctuation array-end-${--state.arrayDepth}`;
    }
    if (token.text === "}") {
      state.stack.pop();
      return `punctuation table-end-${--state.tableDepth}`;
    }

    if (token.text === "," || token.text === ":") {
      return "punctuation";
    }

    // Date and time
    if (
      token.text.match(NUMBER_RE) &&
      (token?.next?.text === ":" || token?.next?.text === "-")
    ) {
      return ["token-datetime", "token-datetime"];
    }
    if (
      token?.prev?.type === "token-datetime" &&
      isAdjacent(token, token.prev)
    ) {
      return "token-datetime";
    }

    // is token a number?
    if (token.text.match(NUMBER_RE)) {
      return "number";
    }
    if (
      (
        ["+", "-", "."].includes(token.text) &&
        token?.next?.text.match(NUMBER_RE)
      ) || (
        ["e", "E", "."].includes(token.text) &&
        token?.prev?.type === "number")
    ) {
      return ["number", "number"];
    }

    if (token.text === "=") {
      return "operator";
    }

    // no special token
    return "token";
  };
}

function postprocessTOML(token: TypedToken): boolean {
  if (token.type === "comment" || token.type === "number") {
    return isAdjacent(token, token.prev);
  }
  if (
    token.type === "string"
    && ["'", '"'].includes(token.text)
    && token.text === token?.prev?.text
  ) {
    return isAdjacent(token, token.prev);
  }
  if (
    token.type === "header"
    && ["[", "]"].includes(token.text)
    && token.text === token?.prev?.text
  ) {
    return true;
  }
  return false;
}

const theme: LanguageTheme = {
  number: {
    color: themeColors.number,
  },
  keyword: {
    color: themeColors.number,
  },
  key: {
    color: themeColors.string,
  },
  value: {
    color: themeColors.value,
  },
  header: {
    color: themeColors.literal,
    "font-weight": "bold",
  },
  punctuation: {
    color: themeColors.punctuation,
  },
  operator: {
    color: themeColors.type,
  },
  comment: {
    color: themeColors.comment,
    "font-style": "italic",
  },
};

export const languageDefinition: LanguageDefinition<{}> = {
  name: "toml",
  theme,
  definitionFactory: defineTOML,
  postprocessor: postprocessTOML,
};
