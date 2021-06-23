// Implements support for both plain JavaScript and TypeScript with JSX syntax.
// TS features are controlled by a flag, which the TypeScript language
// definition binds to true.

import { LanguageTheme, themeColors } from "../language/theme";
import { isAdjacent, isNewLine, lookbehindType } from "../util";
import {
  LanguageDefinition,
  LanguageFunction,
  LanguageFunctionResult,
  LanguageTokens,
  TextTokens,
  TypedTokens,
} from "../types";
import { Stack } from "../language/lib";

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

type ParenType = "parens" | "arguments" | "type" | "call" | "condition";

type JSXTagType = "tag" | "component" | "fragment" | "none";

type StringType = `"` | `'` | "`";

const LITERALS = new Set(["false", "true", "null", "undefined"]);

// Does not include "-" and "+" to ease handling of negative numbers. Does also
// not include ":" as a part of ternary operators, because they have to be
// disambiguated from object property assignment manually.
const OPERATORS = new Set(["!", "=", "&", "|", "<", ">", "/", "?"]);

const PUNCTUATION = new Set([".", ":", ",", ";"]);

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

function startRegex(token: LanguageTokens): boolean {
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

function endRegex(token: TextTokens): boolean {
  const endWithFlag = token.prev?.text === "/" && token.text.match(RE_FLAGS_RE);
  const endWithPunctuation = token.text === "/" && token.next?.text === ";";
  if (endWithFlag || endWithPunctuation) {
    return true;
  }
  return false;
}

function searchAheadForArrow(token: TextTokens | undefined): boolean {
  let nested = 0;
  while (token) {
    if (token.text === "(") {
      nested++;
      token = token.next;
      continue;
    }
    if (nested === 0) {
      if (
        token.text === ")" &&
        token.next?.text === "=" &&
        token.next?.next?.text === ">"
      ) {
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

function inStringMode(state: State): boolean {
  if (state.stringStack.size() === 0) {
    return false;
  }
  if (state.stringInterpolationState) {
    return false;
  }
  return true;
}

type State = {
  lineCommentState: boolean;
  blockCommentState: boolean;
  regexState: boolean;
  stringStack: Stack<StringType | undefined>;
  stringInterpolationState: boolean;
  stringInterpolationDepth: number;
  bracketStack: Stack<BracketType>;
  curlyStack: Stack<CurlyType>;
  parenStack: Stack<ParenType>;
  objectState: "lhs" | "rhs" | false;
};

function defaultState(): State {
  return {
    lineCommentState: false,
    blockCommentState: false,
    regexState: false,
    stringStack: new Stack<StringType | undefined>(undefined),
    stringInterpolationState: false,
    stringInterpolationDepth: 0,
    bracketStack: new Stack<BracketType>("bracket"),
    curlyStack: new Stack<CurlyType>("curly"),
    parenStack: new Stack<ParenType>("parens"),
    objectState: false,
  };
}

function defineECMAScript(flags: Flags = { types: false }): LanguageFunction {
  const state = defaultState();

  return function ecmaScript(token: LanguageTokens): LanguageFunctionResult {
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
      !inStringMode(state) &&
      token.text === "/" &&
      token.prev?.text === "*"
    ) {
      state.blockCommentState = false;
      return "comment block";
    }
    // enter block comment state
    if (
      state.blockCommentState === false &&
      !inStringMode(state) &&
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
      !inStringMode(state) &&
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

    // exit string interpolation mode
    if (
      state.stringInterpolationState &&
      token.text === "}" &&
      token.prev?.text !== "\\"
    ) {
      state.stringInterpolationState = false;
      state.stringInterpolationDepth--;
      return "operator interpolation";
    }
    // enter string interpolation mode
    if (
      state.stringStack.peek().value === "`" &&
      token.text === "$" &&
      token.next?.text === "{" &&
      isAdjacent(token, token.next)
    ) {
      state.stringInterpolationState = true;
      state.stringInterpolationDepth++;
      return ["operator interpolation", "operator interpolation"];
    }

    // exit string state
    if (
      token.text === state.stringStack.peek().value &&
      !state.stringInterpolationState
    ) {
      state.stringStack.pop();
      if (state.stringInterpolationDepth > 0) {
        state.stringInterpolationState = true;
      }
      return "string";
    }
    // enter string state
    if (
      (token.text === "'" || token.text === "`" || token.text === `"`) &&
      !inStringMode(state)
    ) {
      state.stringStack.push(token.text);
      return "string";
    }
    // are we in non-interpolating string state?
    if (inStringMode(state)) {
      return "string";
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
      return "operator";
    }

    if (token.text === "(") {
      if (token.prev?.type.startsWith("call")) {
        const { before } = state.parenStack.push("call");
        return `punctuation call-start-${before}`;
      }
      if (
        token.prev?.type === "declaration function" ||
        token.prev?.type === "keyword function"
      ) {
        const { before } = state.parenStack.push("arguments");
        return `punctuation arguments-start-${before}`;
      }
      if (
        token.prev?.type === "keyword" &&
        ["for", "while", "if", "switch", "catch"].includes(token.prev?.text)
      ) {
        const { before } = state.parenStack.push("condition");
        return `punctuation condition-start-${before}`;
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
      if (token.prev?.type === "operator" || token.prev?.text === ":") {
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
        state.objectState = "lhs";
        return `punctuation destruct-start-${before}`;
      }
      if (
        (token.prev?.type === "keyword" &&
          ["else", "do", "try", "finally"].includes(token.prev?.text)) ||
        token.prev?.type?.match(/condition-end-[\d]+$/)
      ) {
        const { before } = state.curlyStack.push("block");
        return `punctuation block-start-${before}`;
      }
      if (
        token.prev?.type?.match(/arguments-end/) ||
        token.prev?.type === "operator arrow"
      ) {
        const { before } = state.curlyStack.push("function");
        return `punctuation function-start-${before}`;
      }
      // Must be before nested destruct
      if (token.prev?.type === "operator") {
        const { before } = state.curlyStack.push("object");
        state.objectState = "lhs";
        return `punctuation object-start-${before}`;
      }
      if (state.curlyStack.peek().value === "destruct") {
        // nested destruct?
        const { before } = state.curlyStack.push("destruct");
        state.objectState = "lhs";
        return `punctuation destruct-start-${before}`;
      }
      // Must be after nested destruct
      if (token.prev?.text === ":") {
        const { before } = state.curlyStack.push("object");
        state.objectState = "lhs";
        return `punctuation object-start-${before}`;
      }
      const { before } = state.curlyStack.push("curly");
      return `punctuation curly-start-${before}`;
    }

    if (token.text === "}") {
      const { after, value } = state.curlyStack.pop();
      if (value === "object" || value === "destruct") {
        if (after > 0) {
          state.objectState = "lhs";
        } else {
          state.objectState = false;
        }
      }
      return `punctuation ${value}-end-${after}`;
    }

    if (token.text === ":") {
      if (state.objectState === "lhs") {
        state.objectState = "rhs";
        return "punctuation";
      }
      return "operator"; // ternary
    }

    if (token.text === "," && state.objectState === "rhs") {
      state.objectState = "lhs";
    }

    // Does not handle "-" and "+" - both are part of number handling just below
    if (OPERATORS.has(token.text)) {
      return "operator";
    }

    if (
      (token.text === "NaN" || token.text === "Infinity") &&
      state.objectState !== "lhs"
    ) {
      return "number";
    }

    if (token.text.match(NUMBER_RE)) {
      return "number";
    }
    if (token.text === "-") {
      if (
        token.next &&
        isAdjacent(token, token.next) &&
        (token.next.text.match(NUMBER_RE) || token.next?.text === "Infinity")
      ) {
        return ["number", "number"];
      }
      return "operator"; // -, -- etc.
    }
    if (token.text === "+") {
      if (
        token.prev?.type === "number" &&
        isAdjacent(token, token.prev) &&
        token.next &&
        isAdjacent(token, token.next) &&
        token.next.text.match(NUMBER_RE)
      ) {
        return ["number", "number"];
      }
      return "operator"; // +, ++ etc.
    }
    if ([".", "e", "E"].includes(token.text) && token.prev?.type === "number") {
      return "number";
    }

    // Identifiers
    if (token.text.match(IDENT_RE)) {
      // "Looks like a class" sort of identifier (that's not a function call)
      if (
        state.objectState !== "lhs" &&
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
      if (
        (!OTHER_KEYWORDS.has(token.text) || token.prev?.text === ".") &&
        token.next?.text === "("
      ) {
        return "call";
      }
      // Identifier in a list
      if (lookbehindType(token, ["punctuation", "token"])) {
        return "token";
      }
    }

    if (PUNCTUATION.has(token.text)) {
      return "punctuation";
    }

    // Make sure to treat member expressions not as keywords, but also take care
    // that keywords like "new" are indeed keywords when following a spread
    // operator
    if (OTHER_KEYWORDS.has(token.text) && state.objectState !== "lhs") {
      return "keyword";
    }

    // Contextual keyword "of"
    if (
      state.parenStack.peek().value === "condition" &&
      token.text === "of" &&
      token.prev?.type === "token" &&
      !isAdjacent(token, token.prev)
    ) {
      return "keyword";
    }

    // Make sure to treat member expressions not as values
    if (LITERALS.has(token.text) && state.objectState !== "lhs") {
      return "literal";
    }

    return "token";
  };
}

const theme: LanguageTheme = {
  value: {
    color: themeColors.literal,
  },
  regex: {
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
  call: {
    color: themeColors.global,
  },
  string: {
    color: themeColors.string,
  },
  comment: {
    color: themeColors.comment,
    "font-style": "italic",
  },
};

function postprocessECMAScript(token: TypedTokens): boolean {
  // Join regular expressions, operators, numbers
  if (
    token.type === "regex" ||
    token.type === "number" ||
    token.type.startsWith("operator")
  ) {
    return isAdjacent(token, token.prev);
  }
  // Join comments
  if (token.type.startsWith("comment")) {
    return true;
  }
  // Join rest/spread
  if (
    token.text === "." &&
    (token.prev?.text === "." || token.prev?.text === "..")
  ) {
    return isAdjacent(token, token.prev);
  }
  return false;
}

export const languageDefinition: LanguageDefinition<Flags> = {
  name: "ecmascript",
  theme,
  definitionFactory: defineECMAScript,
  postprocessor: postprocessECMAScript,
};
