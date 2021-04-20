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
  objectDepth: number;
}

function defaultState(): State {
  return {
    comment: false,
    header: false,
    key: false,
    string: false,
    arrayDepth: 0,
    objectDepth: 0,
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

    // exit key state on incoming equals sign. Don't check for existing key
    // state as the current token may be a one-token key
    if (state.header && token.text === "]") {
      state.header = false;
      return "literal-header";
    }
    // enter header state
    if (!state.header && token.x === 0 && token.text === "[") {
      state.header = true;
      return "literal-header";
    }
    // in header state?
    if (state.header) {
      return "literal-header";
    }

    // exit key state on incoming equals sign. Don't check for existing key
    // state as the current token may be a one-token key
    if (token.next?.text === "=") {
      state.key = false;
      return "string-key";
    }
    // enter key state
    if (
      !state.key &&
      !token.prev ||
      token?.prev?.y !== token.y ||
      token.prev.text === "{"
    ) {
      state.key = true;
      return "string-key";
    }
    // in key state?
    if (state.key) {
      return "string-key";
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

    // is token a number?
    if (token.text.match(NUMBER_RE)) {
      return "number";
    }
    if (
      (["+", "-", "."].includes(token.text) && token?.next?.text.match(NUMBER_RE)) ||
      (["e", "E", "."].includes(token.text) && token.prev.type === "number")
    ) {
      return ["number", "number"];
    }

    // is token a keyword?
    if (KEYWORDS.includes(token.text)) {
      return `keyword-${token.text.toLowerCase()}`;
    }

    // Objects and arrays
    if (token.text === "{") {
      return `punctuation-object-start-${state.objectDepth++}`;
    }
    if (token.text === "[") {
      return `punctuation-array-start-${state.arrayDepth++}`;
    }
    if (token.text === "]") {
      return `punctuation-array-end-${--state.arrayDepth}`;
    }
    if (token.text === "}") {
      return `punctuation-object-end-${--state.objectDepth}`;
    }

    if (token.text === "," || token.text === ":") {
      return "punctuation";
    }

    if (token.text === "=") {
      return "operator";
    }

    // no special token
    return "token";
  };
}

function postprocessTOML(token: TypedToken): boolean {
  if (token.type.startsWith("comment") || token.type === "number") {
    return isAdjacent(token, token.prev);
  }
  return false;
}

export const languageDefinition: LanguageDefinition<{}> = {
  name: "toml",
  definitionFactory: defineTOML,
  postprocessor: postprocessTOML,
};
