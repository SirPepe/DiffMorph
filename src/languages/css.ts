import { isAdjacent } from "../lib";
import { RawToken, TypedToken } from "../types";

const STRINGS = ["'", '"', "`"];

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

const NUMERIC_RE = new RegExp(`^(\\d+(\\.\\d+)?|\\.\\d+)(${ UNITS.join("|") })?$`);

type State = {
  stringState: boolean | string; // string indicates the quote used
  commentState: boolean;
  urlState: boolean;
  atHeaderState: boolean;
  ruleContext: "left" | "right" | "none";
  contextStack: string[];
};

function getContext(state: State) {
  if (state.contextStack.length === 0) {
    return "none"
  }
  return state.contextStack[state.contextStack.length - 1];
}

function parseNumeric (token: RawToken): string[] | null {
  if (token.text === "." && token.next && isAdjacent(token, token.next)) {
    const rest = parseNumeric(token.next);
    if (rest) {
      return ["number", ...rest];
    }
  } else if (NUMERIC_RE.test(token.text)) {
    return ["number"]
  }
  return null;
}

const defaultState = (): State => ({
  stringState: false,
  commentState: false,
  urlState: false,
  atHeaderState: false,
  ruleContext: "none",
  contextStack: [],
});

export const languageDefinition = (): ((token: RawToken) => string | string[]) => {
  const state = defaultState();

  return (token: RawToken): string | string[] => {
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
        return "string-url";
      }
      return "string";
    }
    // enter string state
    if (STRINGS.includes(token.text) && state.stringState === false) {
      state.stringState = token.text;
      if (state.urlState) {
        return "string-url";
      }
      return "string";
    }
    // are we in string state?
    if (state.stringState) {
      if (state.urlState) {
        return "string-url";
      }
      return "string";
    }

    // exit url state
    if (state.urlState && token.text === ")") {
      state.urlState = false;
      return "punctuation-url";
    }
    // enter url state
    if (token.text.toLowerCase() === "url" && token?.next?.text === "(") {
      state.urlState = true;
      return ["keyword-url", "punctuation-url"];
    }
    // are we in url state? If the url is quoted, string logic takes over
    if (state.urlState) {
      return "string-url";
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
      return [`keyword-${value}`, `keyword-${value}`];
    }

    // @rule header
    if (getContext(state).startsWith("at-")) {
      if (token.text === "}") {
        const value = `punctuation-${getContext(state)}-end`;
        state.contextStack.pop();
        return value;
      }
      if (state.atHeaderState) {
        if (getContext(state).endsWith("media") && MEDIA_TYPES.has(token.text)) {
          return "keyword-media-type";
        }
        if (token.text === "(" || token.text === ")") {
          return `punctuation-${getContext(state)}-argument`;
        }
        if (token.text === "{") {
          state.atHeaderState = false;
          return `punctuation-${getContext(state)}-start`;
        }
        if (token.text === ":") {
          return `punctuation-${getContext(state)}`;
        }
        if (["and", "not", "or", "only"].includes(token.text.toLowerCase())) {
          return "operator";
        }
        const numeric = parseNumeric(token);
        if (numeric) {
          return numeric.map( (type) => `${type}-${getContext(state)}`);
        }
      }
    }

    // exit css rule selector state, enter rule state
    if (getContext(state) === "selector" && token.text === "{") {
      state.contextStack[state.contextStack.length - 1] = "rule";
      state.ruleContext = "left"
      return "punctuation-rule-start";
    }
    // enter css rule selector state
    if (
      getContext(state) !== "rule" &&
      getContext(state) !== "selector" &&
      (!token.prev || ["{", "}"].includes(token?.prev?.text))
    ) {
      state.contextStack.push("selector");
      return "value-selector";
    }
    // css rule selector state
    if (getContext(state) === "selector") {
      return "value-selector";
    }
    // exit css rule state
    if (getContext(state) === "rule" && token.text === "}") {
      state.contextStack.pop();
      state.ruleContext = "none";
      return "punctuation-rule-end";
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
      return "keyword-function";
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

    // no special token
    return "token";
  };
};

export const gluePredicate = (token: TypedToken): boolean => {
  // Join @ sign and rule name
  if (token.type.startsWith("keyword-at") && token.type === token?.prev?.type) {
    return true;
  }
  // Join colons, dots and hashes with selector token directly afterwards
  if (
    token.type === "value-selector" &&
    token?.prev?.type === token.type &&
    isAdjacent(token, token.prev) &&
    [":", ".", "#"].includes(token.prev.text)
  ) {
    return true;
  }
  // Join property names
  if (token.type === "property" && token.prev?.type === "property") {
    return true;
  }
  // Join floating point numbers
  if (
    (token.text === "." && token?.prev?.type === "number") ||
    (token.type === "number" && token?.prev?.text?.endsWith("."))
  ) {
    return true;
  }
  // The tokenizer separates numbers and % signs, so we repair this here
  if (token.text === "%" && token?.prev?.type === "number") {
    return true;
  }
  // Join comment text and comment signifier, but not to each other
  if (token.type === "comment" && token?.prev?.type === "comment") {
    if (token.text === "*" && token?.prev?.text === "/") {
      return true;
    }
    if (token.text === "/" && token?.prev?.text === "*") {
      return true;
    }
    if (token.text !== "*" && token?.prev?.text !== "*") {
      return true;
    }
    if (token.text !== "/" && token?.prev?.text !== "*") {
      return true;
    }
    return false;
  }
  return false;
};
