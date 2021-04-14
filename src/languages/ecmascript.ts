// Implements support for both plain JavaScript and TypeScript with JSX syntax.
// TS features are controlled by a flag, which the TypeScript language
// definition binds to true.

import { isNewLine } from "../lib/util";
import {
  LanguageDefinition,
  LanguageFunction,
  LanguageFunctionResult,
  RawToken,
} from "../types";

type BlockType =
  | "curlies"
  | "object"
  | "type"
  | "block"
  | "class"
  | "interface"
  | "enum"
  | "export"
  | "import"
  | "function"
  | "switch"
  | "array"
  | "jsx-interpolation";

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

type State = {
  statementPosition: boolean;
  expressionPosition: boolean;
  typePosition: boolean;
  lineCommentState: boolean;
  blockCommentState: boolean;
  regexState: boolean;
  stringState: false | string; // string indicates the type of quotes used
};

function defaultState(): State {
  return {
    statementPosition: true,
    expressionPosition: true,
    typePosition: false,
    lineCommentState: false,
    blockCommentState: false,
    regexState: false,
    stringState: false,
  };
}

function processVariableDeclaration(token: RawToken, flags: Flags): string[] {
  let current: RawToken | undefined = token.next;
  let destructuringDepth = 0;
  const types: string[] = [];
  while (current) {
    if (current.text === "[" || current.text === "{") {
      types.push(`punctuation-destruct-start-${destructuringDepth++}`);
      current = current.next;
      continue;
    }
    if (current.text === "]" || current.text === "}") {
      types.push(`punctuation-destruct-end-${--destructuringDepth}`);
      current = current.next;
      continue;
    }
    if (current.text === "=") {
      types.push("operator-assignment");
      if (destructuringDepth === 0) {
        break;
      } else if (current.next) {
        types.push(...processExpression(current.next, flags));
        current = current.next.next;
      }
      continue;
    }
    if (current.text === ":") {
      if (destructuringDepth === 0 && flags.types) {
        types.push("operator-annotation");
        break;
      }
    }
    if (current.text === ";") {
      types.push("punctuation");
      break;
    }
    if (current.text === "," || current.text === ":") {
      types.push(`punctuation`);
    } else {
      types.push(`token`);
    }
    current = current.next;
  }
  return [`keyword-${token.text}`, ...types];
}

function processExpression(token: RawToken, flags: Flags): string[] {
  if (
    token.text === "NaN" ||
    token.text === "Infinity" ||
    token.text.match(NUMBER_RE)
  ) {
    return ["number"];
  }
  return ["token"];
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

    if (
      state.statementPosition &&
      ["var", "let", "const"].includes(token.text)
    ) {
      const declaration = processVariableDeclaration(token, flags);
      const last = declaration[declaration.length - 1];
      if (last.endsWith("annotation")) {
        state.typePosition = true;
        state.expressionPosition = false;
        state.statementPosition = false;
      } else if (last.endsWith("assignment")) {
        state.typePosition = false;
        state.expressionPosition = true;
        state.statementPosition = false;
      }
      return declaration;
    }

    if (state.expressionPosition && token.text !== ";") {
      return processExpression(token, flags);
    }

    if (PUNCTUATION.includes(token.text)) {
      return "punctuation";
    }

    return "token";
  };
}

function postprocessECMAScript(): boolean {
  return false;
}

export const languageDefinition: LanguageDefinition<Flags> = {
  name: "ecmascript",
  definitionFactory: defineECMAScript,
  postprocessor: postprocessECMAScript,
};
