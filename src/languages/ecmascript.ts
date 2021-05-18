// Implements support for both plain JavaScript and TypeScript with JSX syntax.
// TS features are controlled by a flag, which the TypeScript language
// definition binds to true.

import { LanguageTheme, themeColors } from "../lib/theme";
import {
  isAdjacent,
  isNewLine,
  lookbehindText,
  lookbehindType,
} from "../lib/util";
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

type BracketType = "array" | "type" | "destruct" | "bracket";

type ParenType =
  | "parens"
  | "arguments"
  | "type"
  | "call"
  | "switch-condition"
  | "condition";

type JSXTagType = "tag" | "component" | "fragment" | "none";

const VALUES = new Set(["false", "true", "null", "undefined"]);
const OPERATORS = ["!", "=", "&", "|", "+", "-", "<", ">", "/"];
const PUNCTUATION = [".", ":", ",", ";"];
const STRINGS = ["'", '"', "`"];
const NUMBER_RE = /^0b[01]|^0o[0-7]+|^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i;
const RE_FLAGS_RE = /^[gimuy]+$/;
const IDENT_RE = /^[$_a-z][$_a-z0-9]*$/i; // accepts REASONABLE identifiers

const TYPE_KEYWORDS = ["type", "enum", "interface", "infer"];

const OTHER_KEYWORDS = new Set([
  "async",
  "await",
  "catch",
  "for",
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
]);

const GLOBALS = new Set([
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
]);

type Flags = {
  types: boolean;
};

function startRegex(token: RawToken): boolean {
  if (token.text !== "/") {
    return false;
  }
  // To have a regex start, the next token must be adjacent
  if (!isAdjacent(token, token.next)) {
    return false;
  }
  // Check that this is not the start of a comment
  if (token.prev?.text === "/" || token.prev?.text === "*") {
    return false;
  }
  // Check that we don't take a division as the start of a regex literal
  if (token.prev?.type === "number") {
    return false;
  }
  // Check that this is not divide-equals
  if (token.next?.text === "=") {
    return false;
  }
  return true;
}

function endRegex(token: RawToken): boolean {
  const endWithFlag = token.prev?.text === "/" && token.text.match(RE_FLAGS_RE);
  const endWithPunctuation = token.text === "/" && token.next?.text === ";";
  if (endWithFlag || endWithPunctuation) {
    return true;
  }
  return false;
}

function searchAheadForArrow(token: RawToken | undefined): boolean {
  let nested = 0;
  while (token) {
    if (token.text === "(") {
      nested++;
      token = token.next;
      continue;
    }
    if (nested === 0) {
      if (token.text === ")" && token.next?.text === "=" && token.next?.next?.text === ">") {
        return true;
      }
      if (token.text === ";") {
        return false;
      }
      if (
        token.prev &&
        token.y !== token.prev.y &&
        [",", ";", "(", "[", "["].includes(token.prev.text) === false
      ) {
        console.log(token.text)
        return false;
      }
      token = token.next;
      continue;
    } else {
      if (token.text === ")") {
        nested--;
      }
      token = token.next;
      continue;
    }
  }
  return false;
}

class Stack<T extends string> {
  private data: T[] = [];
  constructor(private defaultValue: T) {}

  push(value: T): { before: number; after: number } {
    const before = this.data.filter((str) => str === value).length;
    this.data.push(value);
    return { before, after: before + 1 };
  }

  pop(): { before: number; after: number; value: T } {
    const value = this.data[this.data.length - 1];
    if (!value) {
      return { before: 0, after: 0, value: this.defaultValue };
    }
    const before = this.data.filter((str) => str === value).length;
    this.data.length = this.data.length - 1;
    return { before, after: before - 1, value };
  }

  peek(): { current: number; value: T } {
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
  parenStack: Stack<ParenType>;
};

function defaultState(): State {
  return {
    lineCommentState: false,
    blockCommentState: false,
    regexState: false,
    stringState: false,
    bracketStack: new Stack<BracketType>("bracket"),
    curlyStack: new Stack<CurlyType>("curly"),
    parenStack: new Stack<ParenType>("parens"),
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
      return "comment block";
    }
    // enter block comment state
    if (
      state.blockCommentState === false &&
      state.stringState === false &&
      token.text === "/" &&
      token?.next?.text === "*"
    ) {
      state.blockCommentState = true;
      return "comment block";
    }
    // are we in block comment state?
    if (state.blockCommentState) {
      return "comment block";
    }

    // enter line comment state
    if (
      state.lineCommentState === false &&
      state.stringState === false &&
      token.text === "/" &&
      token?.next?.text === "/"
    ) {
      state.lineCommentState = true;
      return "comment line";
    }
    // are we in line comment state?
    if (state.lineCommentState) {
      return "comment line";
    }

    // exit re state
    if (state.regexState === true && endRegex(token)) {
      state.regexState = false;
      return "regex";
    }
    // enter re state
    if (state.regexState === false && startRegex(token)) {
      state.regexState = true;
      return "regex";
    }
    // are we in re state?
    if (state.regexState === true) {
      return "regex";
    }

    // Assorted keywords
    if (["var", "let", "const"].includes(token.text)) {
      return "keyword";
    }
    if (token.text === "function") {
      return "keyword function";
    }

    if (token.text === "=") {
      if (token?.next?.text === ">") {
        return ["operator arrow", "operator arrow"];
      }
      return "operator assignment";
    }

    if (token.text === "(") {
      if (token.prev?.type.startsWith("call")) {
        const { before } = state.parenStack.push("call");
        return `punctuation call-start-${before}`;
      }
      if (
        token?.prev?.type === "declaration function" ||
        token?.prev?.type === "keyword function"
      ) {
        const { before } = state.parenStack.push("arguments");
        return `punctuation arguments-start-${before}`;
      }
      // This is not how proper JS engines do it, but it's easy to build
      if (token.next && searchAheadForArrow(token.next)) {
        const { before } = state.parenStack.push("arguments");
        return `punctuation arguments-start-${before}`;
      }
      // Fallback and comma expressions
      const { before } = state.parenStack.push("parens");
      return `punctuation parens-start-${before}`;
    }

    if (token.text === ")") {
      const { after, value } = state.parenStack.pop();
      return `punctuation ${value}-end-${after}`;
    }

    if (token.text === "[") {
      if (token.prev && ["var", "let", "const"].includes(token.prev.text)) {
        const { before } = state.bracketStack.push("destruct");
        return `punctuation destruct-start-${before}`;
      }
      if (
        token?.prev?.type === "operator assignment" ||
        token?.prev?.text === ":"
      ) {
        const { before } = state.bracketStack.push("array");
        return `punctuation array-start-${before}`;
      }
      const { before } = state.bracketStack.push("bracket");
      return `punctuation bracket-start-${before}`;
    }

    if (token.text === "]") {
      const { after, value } = state.bracketStack.pop();
      return `punctuation ${value}-end-${after}`;
    }

    if (token.text === "{") {
      if (token.prev && ["var", "let", "const"].includes(token.prev.text)) {
        const { before } = state.curlyStack.push("destruct");
        return `punctuation destruct-start-${before}`;
      }
      if (
        token?.prev?.type?.match(/arguments-end/) ||
        token?.prev?.type === "operator arrow"
      ) {
        const { before } = state.curlyStack.push("function");
        return `punctuation function-start-${before}`;
      }
      // Must be before nested destruct
      if (token?.prev?.type === "operator assignment") {
        const { before } = state.curlyStack.push("object");
        return `punctuation object-start-${before}`;
      }
      if (state.curlyStack.peek().value === "destruct") {
        // nested destruct?
        const { before } = state.curlyStack.push("destruct");
        return `punctuation destruct-start-${before}`;
      }
      // Must be after nested destruct
      if (token?.prev?.text === ":") {
        const { before } = state.curlyStack.push("object");
        return `punctuation object-start-${before}`;
      }
      const { before } = state.curlyStack.push("curly");
      return `punctuation curly-start-${before}`;
    }

    if (token.text === "}") {
      const { after, value } = state.curlyStack.pop();
      return `punctuation ${value}-end-${after}`;
    }

    if (
      token.text === "NaN" ||
      token.text === "Infinity" ||
      token.text.match(NUMBER_RE)
    ) {
      return "number";
    }
    if (
      token.text === "-" &&
      token.next &&
      isAdjacent(token, token.next) &&
      (token.next.text.match(NUMBER_RE) || token.next?.text === "Infinity")
    ) {
      return ["number", "number"];
    }
    if (
      token.text === "+" &&
      token.prev?.type === "number" &&
      isAdjacent(token, token.prev) &&
      token.next &&
      isAdjacent(token, token.next) &&
      token.next.text.match(NUMBER_RE)
    ) {
      return ["number", "number"];
    }
    if ([".", "e", "E"].includes(token.text) && token.prev?.type === "number") {
      return "number";
    }

    // Identifiers
    if (token.text.match(IDENT_RE)) {
      // "Looks like a class" sort of identifier (that's not a function call)
      if (
        /[A-Z]/.test(token.text[0]) &&
        token.next?.text !== "(" &&
        token.prev?.text !== "new"
      ) {
        return "class";
      }
      // Known global (that's not a function call)
      if (
        GLOBALS.has(token.text) &&
        token.prev?.text !== "." &&
        token.next?.text !== "(" &&
        token.prev?.text !== "new"
      ) {
        return "global";
      }
      // Regular identifier
      if (token.prev && ["var", "let", "const"].includes(token.prev.text)) {
        return "token";
      }
      // Declarations
      if (token.prev?.type === "keyword function") {
        return "declaration function";
      }
      // Function and constructor calls
      if (token.prev?.type === "keyword" && token.prev.text === "new") {
        return "call constructor";
      }
      if (token.next?.text === "(") {
        return "call";
      }
      // Identifier in a list
      if (
        lookbehindType<RawToken | TypedToken>(token, ["punctuation", "token"])
      ) {
        return "token";
      }
    }

    if (PUNCTUATION.includes(token.text)) {
      return "punctuation";
    }

    // Make sure to treat member expressions not as keywords, but also take care
    // that keywords like "new" are indeed keywords when following a spread
    // operator
    if (
      OTHER_KEYWORDS.has(token.text) &&
      (token.prev?.text !== "." ||
        lookbehindText<RawToken | TypedToken>(token, [".", ".", "."])) &&
      !token?.prev?.type.match(/object-start/)
    ) {
      return "keyword";
    }

    // Make sure to treat member expressions not as values
    if (
      VALUES.has(token.text) &&
      token.prev?.text !== "." &&
      !token?.prev?.type.match(/object-start/)
    ) {
      return "value";
    }

    return "token";
  };
}

const theme: LanguageTheme = {
  value: {
    color: themeColors.literal,
  },
  number: {
    color: themeColors.value,
  },
  keyword: {
    color: themeColors.foreground,
    "font-weight": "bold",
  },
  declaration: {
    color: themeColors.string,
    "font-weight": "bold",
  },
  operator: {
    color: themeColors.string,
  },
  punctuation: {
    color: themeColors.punctuation,
  },
  comment: {
    color: themeColors.comment,
    "font-style": "italic",
  },
};

function postprocessECMAScript(token: TypedToken): boolean {
  // Join rest/spread
  if (
    token.text === "." &&
    (token.prev?.text === "." || token.prev?.text === "..")
  ) {
    return true;
  }
  // Join regular expressions
  if (token.type === "regex" && token?.prev?.type === token.type) {
    return true;
  }
  // Join arrows
  if (token.type === "operator arrow" && token?.prev?.type === token.type) {
    return true;
  }
  // Join floating point numbers
  if (
    token.type === "number" &&
    token?.prev?.type === token.type &&
    isAdjacent(token, token.prev)
  ) {
    return true;
  }
  return false;
}

export const languageDefinition: LanguageDefinition<Flags> = {
  name: "ecmascript",
  theme,
  definitionFactory: defineECMAScript,
  postprocessor: postprocessECMAScript,
};
