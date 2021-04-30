// Implements support for both plain JavaScript and TypeScript with JSX syntax.
// TS features are controlled by a flag, which the TypeScript language
// definition binds to true.

import { isNewLine, lookbehindType } from "../lib/util";
import {
  LanguageDefinition,
  LanguageFunction,
  LanguageFunctionResult,
  RawToken,
  TypedToken,
} from "../types";

type CurlyType =
  | "object"
  | "type"
  | "destruct"
  | "class"
  | "interface"
  | "enum"
  | "export"
  | "import"
  | "function"
  | "switch"
  | "jsx-interpolation"
  | "block"
  | "curly";

type BracketType =
  | "array"
  | "type"
  | "destruct"
  | "bracket";

type ParenType =
  | "parens"
  | "arguments"
  | "type"
  | "call"
  | "switch-condition"
  | "condition";

type JSXTagType = "tag" | "component" | "fragment" | "none";

const VALUES = ["false", "true", "null", "undefined"];
const NUMBERS = ["Infinity", "NaN"];
const OPERATORS = ["!", "=", "&", "|", "+", "-", "<", ">", "/"];
const PUNCTUATION = [".", ":", ",", ";"];
const STRINGS = ["'", '"', "`"];
const NUMBER_RE = /^0b[01]|^0o[0-7]+|^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i;
const RE_FLAGS_RE = /^[gimuy]+$/;
const IDENT_RE = /^[$_a-z][$_a-z0-9]*$/i; // accepts REASONABLE identifiers

const TYPE_KEYWORDS = ["type", "enum", "interface", "infer"];

const KEYWORDS = [
  "async",
  "await",
  "catch",
  "for",
  "function",
  "if",
  "return",
  "super",
  "switch",
  "throw",
  "try",
  "while",
  "class",
  "let",
  "var",
  "const",
  "with",
  "do",
  "break",
  "case",
  "continue",
  "debugger",
  "delete",
  "default",
  "else",
  "eval",
  "extends",
  "finally",
  "implements",
  "in",
  "instanceof",
  "new",
  "package",
  "private",
  "protected",
  "public",
  "static",
  "this",
  "self",
  "typeof",
  "void",
  "yield",
];

const GLOBALS = [
  "Array",
  "window",
  "setTimeout",
  "setInterval",
  "clearTimeout",
  "clearInterval",
  "console",
  "navigator",
  "Promise",
  "Math",
  "alert",
  "document",
  "Symbol",
  "decodeURI",
  "decodeURIComponent",
  "encodeURI",
  "encodeURIComponent",
  "escape",
  "eval",
  "isFinite",
  "isNaN",
  "Number",
  "parseFloat",
  "parseInt",
  "String",
  "unescape",
  "Object",
  "Boolean",
];

type Flags = {
  types: boolean;
};

class Stack<T extends string> {
  private data: T[] = [];
  constructor(private defaultValue: T){}

  push(value: T): { before: number, after: number } {
    const before = this.data.filter((str) => str === value).length;
    this.data.push(value);
    return { before, after: before + 1 };
  }

  pop(): { before: number, after: number, value: T } {
    const value = this.data[this.data.length - 1];
    if (!value) {
      return { before: 0, after: 0, value: this.defaultValue };
    }
    const before = this.data.filter((str) => str === value).length;
    this.data.length = this.data.length - 1;
    return { before, after: before - 1, value };
  }

  peek(): { current: number, value: T } {
    const value = this.data[this.data.length - 1];
    if (!value) {
      return { current: 0, value: this.defaultValue };
    }
    const current = this.data.filter((str) => str === value).length;
    return { current, value };
  }
}

type State = {
  lineCommentState: boolean;
  blockCommentState: boolean;
  regexState: boolean;
  stringState: false | string; // string indicates the type of quotes used
  bracketStack: Stack<BracketType>;
  curlyStack: Stack<CurlyType>;
};

function defaultState(): State {
  return {
    lineCommentState: false,
    blockCommentState: false,
    regexState: false,
    stringState: false,
    bracketStack: new Stack<BracketType>("bracket"),
    curlyStack: new Stack<CurlyType>("curly"),
  };
}

function defineECMAScript(flags: Flags = { types: false }): LanguageFunction {
  const state = defaultState();

  return function ecmaScript(token: RawToken): LanguageFunctionResult {
    // exit line comment state (on new line)
    if (state.lineCommentState && isNewLine(token)) {
      state.lineCommentState = false;
    }

    // exit regex state (on new line)
    if (state.regexState && isNewLine(token)) {
      state.regexState = false;
    }

    // exit block comment state
    if (
      state.blockCommentState === true &&
      state.stringState === false &&
      token.text === "/" &&
      token?.prev?.text === "*"
    ) {
      state.blockCommentState = false;
      return "comment-block";
    }
    // enter block comment state
    if (
      state.blockCommentState === false &&
      state.stringState === false &&
      token.text === "/" &&
      token?.next?.text === "*"
    ) {
      state.blockCommentState = true;
      return "comment-block";
    }
    // are we in block comment state?
    if (state.blockCommentState) {
      return "comment-block";
    }

    // enter line comment state
    if (
      state.lineCommentState === false &&
      state.stringState === false &&
      token.text === "/" &&
      token?.next?.text === "/"
    ) {
      state.lineCommentState = true;
      return "comment-line";
    }
    // are we in line comment state?
    if (state.lineCommentState) {
      return "comment-line";
    }

    if (["var", "let", "const"].includes(token.text)) {
      return "keyword";
    }

    // Identifiers
    if (token.text.match(IDENT_RE)) {
      // Regular identifier
      if (token.prev && ["var", "let", "const"].includes(token.prev.text)) {
        return "token";
      }
      // Identifier in a list
      if (lookbehindType<RawToken | TypedToken>(token, ["punctuation", "token"])) {
        return "token";
      }
    }

    if (token.text === "=") {
      return "operator-assignment";
    }

    if (token.text === "[") {
      if (token.prev && ["var", "let", "const"].includes(token.prev.text)) {
        const { before } = state.bracketStack.push("destruct");
        return `punctuation-destruct-start-${before}`;
      }
      const { before } = state.bracketStack.push("bracket");
      return `punctuation-bracket-start-${before}`;
    }

    if (token.text === "]") {
      const { after, value } = state.bracketStack.pop();
      return `punctuation-${value}-end-${after}`;
    }

    if (token.text === "{") {
      if (token.prev && ["var", "let", "const"].includes(token.prev.text)) {
        const { before } = state.curlyStack.push("destruct");
        return `punctuation-destruct-start-${before}`;
      }
      if (token?.prev?.type === "operator-assignment") {
        const { before } = state.curlyStack.push("object");
        return `punctuation-object-start-${before}`;
      }
      const { before } = state.curlyStack.push("curly");
      return `punctuation-curly-start-${before}`;
    }

    if (token.text === "}") {
      const { after, value } = state.curlyStack.pop();
      return `punctuation-${value}-end-${after}`;
    }

    if (PUNCTUATION.includes(token.text)) {
      return "punctuation";
    }

    if (
      token.text === "NaN" ||
      token.text === "Infinity" ||
      token.text.match(NUMBER_RE)
    ) {
      return "number";
    }

    return "token";
  };
}

function postprocessECMAScript(): boolean {
  return false;
}

export const languageDefinition: LanguageDefinition<Flags> = {
  name: "ecmascript",
  theme: {},
  definitionFactory: defineECMAScript,
  postprocessor: postprocessECMAScript,
};
