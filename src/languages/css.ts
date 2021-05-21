import { LanguageTheme, themeColors } from "../lib/theme";
import { isAdjacent } from "../lib/util";
import {
  LanguageDefinition,
  LanguageFunction,
  LanguageFunctionResult,
  RawToken,
  TokenReplacementResult,
  TypedToken,
} from "../types";
import { CSS_COLOR_KEYWORDS } from "./constants";

const STRINGS = ["'", '"', "`"];

const COMBINATORS = new Set(["+", "~", ">"]);

const MEDIA_TYPES = new Set([
  "all",
  "braille",
  "embossed",
  "handheld",
  "print",
  "projection",
  "screen",
  "speech",
  "tty",
  "tv",
]);

const UNITS = [
  "em",
  "ex",
  "%",
  "px",
  "cm",
  "mm",
  "in",
  "pt",
  "pc",
  "ch",
  "rem",
  "vh",
  "vw",
  "vmin",
  "vmax",
  "deg",
  "grad",
  "rad",
  "turn",
  "s",
  "ms",
  "hz",
  "khz",
  "dpi",
  "dpcm",
  "dppx",
];

const NUMERIC_RE = new RegExp(
  `^(\\d+(?:\\.\\d+)?|\\.\\d+)?(${UNITS.join("|")})?$`
);

type State = {
  stringState: boolean | string; // string indicates the quote used
  commentState: boolean;
  urlState: boolean;
  atHeaderState: boolean;
  ruleContext: "left" | "right" | "none";
  contextStack: string[];
};

type Flags = {
  inline?: boolean;
};

function getContext(state: State) {
  if (state.contextStack.length === 0) {
    return "none";
  }
  return state.contextStack[state.contextStack.length - 1];
}

function parseNumeric(
  token: RawToken
): (string | TokenReplacementResult)[] | null {
  if (token.text === "." && token.next && isAdjacent(token, token.next)) {
    const rest = parseNumeric(token.next);
    if (rest) {
      return ["number", ...rest];
    }
  }
  const { 1: number, 2: unit } = NUMERIC_RE.exec(token.text) ?? [];
  if (!number && !unit) {
    return null;
  }
  if (number && !unit) {
    return ["number"];
  }
  if (!number && unit) {
    return ["unit"];
  }
  return [
    {
      replacements: [
        { text: number, type: "number" },
        { text: unit, type: "unit" },
      ],
    },
  ];
}

function defaultState(): State {
  return {
    stringState: false,
    commentState: false,
    urlState: false,
    atHeaderState: false,
    ruleContext: "none",
    contextStack: [],
  };
}

function defineCss(flags: Flags = { inline: false }): LanguageFunction {
  const state = defaultState();
  const { inline } = flags;

  // Assume start at the property level when in inline mode
  if (inline) {
    state.contextStack = ["rule"];
    state.ruleContext = "left";
  }

  return function css(token: RawToken): LanguageFunctionResult {
    // exit comment state
    if (
      state.commentState === true &&
      state.stringState === false &&
      token.text === "/" &&
      token.prev?.text === "*"
    ) {
      state.commentState = false;
      return "comment";
    }
    // enter comment state
    if (
      state.commentState === false &&
      state.stringState === false &&
      token.text === "/" &&
      token?.next?.text === "*"
    ) {
      state.commentState = true;
      return "comment";
    }
    // are we in comment state?
    if (state.commentState) {
      return "comment";
    }

    // exit string state
    if (token.text === state.stringState) {
      state.stringState = false;
      if (state.urlState) {
        return "string url";
      }
      return "string";
    }
    // enter string state
    if (STRINGS.includes(token.text) && state.stringState === false) {
      state.stringState = token.text;
      if (state.urlState) {
        return "string url";
      }
      return "string";
    }
    // are we in string state?
    if (state.stringState) {
      if (state.urlState) {
        return "string url";
      }
      return "string";
    }

    // exit url state
    if (state.urlState && token.text === ")") {
      state.urlState = false;
      return "punctuation url";
    }
    // enter url state
    if (token.text.toLowerCase() === "url" && token?.next?.text === "(") {
      state.urlState = true;
      return ["keyword", "punctuation url"];
    }
    // are we in url state? If the url is quoted, string logic takes over
    if (state.urlState) {
      return "string url";
    }

    // enter @rule
    if (token.text === "@" && token?.next?.text.match(/^[a-z-]+$/)) {
      const value = `at-${token?.next?.text}`;
      // Don't treat @import and @charset as a context, as there can be nothing
      // nested inside
      if (value !== `at-import` && value !== `at-charset`) {
        state.contextStack.push(value);
        state.atHeaderState = true;
      }
      return [`keyword ${value}`, `keyword ${value}`];
    }

    // @rule header
    if (getContext(state).startsWith("at-")) {
      if (token.text === "}") {
        const value = `punctuation ${getContext(state)}-end`;
        state.contextStack.pop();
        return value;
      }
      if (state.atHeaderState) {
        if (
          getContext(state).endsWith("media") &&
          MEDIA_TYPES.has(token.text)
        ) {
          return "keyword media-type";
        }
        if (token.text === "(" || token.text === ")") {
          return `punctuation ${getContext(state)}-argument`;
        }
        if (token.text === "{") {
          state.atHeaderState = false;
          return `punctuation ${getContext(state)}-start`;
        }
        if (token.text === ":") {
          return `punctuation ${getContext(state)}`;
        }
        if (["and", "not", "or", "only"].includes(token.text.toLowerCase())) {
          return "operator";
        }
        const numeric = parseNumeric(token);
        if (numeric) {
          return numeric.map((type) => {
            if (typeof type === "string") {
              return `${type} ${getContext(state)}`;
            }
            return type;
          });
        }
      }
    }

    // exit css rule selector state, enter rule state
    if (getContext(state) === "selector" && token.text === "{") {
      state.contextStack[state.contextStack.length - 1] = "rule";
      state.ruleContext = "left";
      return "punctuation rule-start";
    }
    // enter css rule selector state
    if (
      getContext(state) !== "rule" &&
      getContext(state) !== "selector" &&
      (!token.prev ||
        token.prev.type === "comment" ||
        ["{", "}"].includes(token.prev.text) ||
        token.prev.text === ">" || // after <style> embedded in HTML
        token.prev.text === ";") // after @import's semicolon
    ) {
      state.contextStack.push("selector");
      return "selector";
    }
    // css rule selector state
    if (getContext(state) === "selector") {
      if (token.text === ",") {
        return "punctuation";
      }
      if (["[", "]"].includes(token.text)) {
        return "punctuation-selector"; // part of a selector
      }
      if (COMBINATORS.has(token.text)) {
        return "keyword combinator";
      }
      return "selector";
    }
    // exit css rule state
    if (getContext(state) === "rule" && token.text === "}") {
      state.contextStack.pop();
      state.ruleContext = "none";
      return "punctuation rule-end";
    }

    // properties and switching to values
    if (getContext(state) === "rule" && state.ruleContext === "left") {
      if (token.text === ":") {
        state.ruleContext = "right";
        return "punctuation";
      }
      return "property";
    }
    // Switching from values back to properties
    if (
      getContext(state) === "rule" &&
      state.ruleContext === "right" &&
      token.text === ";"
    ) {
      state.ruleContext = "left";
      return "punctuation";
    }

    // Function values like var(), calc() etc.
    if (token.text.match(/[a-z-]/) && token?.next?.text === "(") {
      return "keyword function";
    }

    // Number values
    const numeric = parseNumeric(token);
    if (numeric) {
      return numeric;
    }

    // Random punctuation
    if (["{", "}", ":", ",", ";", ")", "("].includes(token.text)) {
      return "punctuation";
    }

    // Non-function (rgba, hsla etc.) colors
    if (
      token.text === "#" &&
      token.next &&
      /[a-f0-9]{3,6}/i.test(token.next.text)
    ) {
      return ["value color", "value color"];
    }
    if (CSS_COLOR_KEYWORDS.has(token.text)) {
      return "value color";
    }

    // no special token
    return "token";
  };
}

function postprocessCss(token: TypedToken): boolean {
  // Join @ sign and rule name
  if (token.type.startsWith("keyword at")) {
    return true;
  }
  // Join colons, dots and hashes with selector token directly afterwards
  if (
    token.prev &&
    token.type === "selector" &&
    isAdjacent(token, token.prev) &&
    [":", ".", "#"].includes(token.prev.text)
  ) {
    return true;
  }
  // Join property names, hex colors, floating point numbers and comments
  if (
    token.type === "property" ||
    token.type === "value color" ||
    token.type === "number" ||
    token.type.startsWith("comment")
  ) {
    return isAdjacent(token, token.prev);
  }
  return false;
}

const theme: LanguageTheme = {
  selector: {
    color: themeColors.string,
    "font-weight": "bold",
  },
  "punctuation-selector": {
    color: themeColors.string,
  },
  keyword: {
    color: themeColors.foreground,
    "font-weight": "bold",
  },
  property: {
    color: themeColors.type,
  },
  string: {
    color: themeColors.string,
  },
  number: {
    color: themeColors.number,
  },
  value: {
    color: themeColors.value,
  },
  unit: {
    color: themeColors.global,
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
  name: "css",
  theme,
  definitionFactory: defineCss,
  postprocessor: postprocessCss,
};
