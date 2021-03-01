import { LanguageToken, TypedLanguageToken } from "../types";

const STRINGS = ["'", '"', "`"];

type State = {
  stringState: boolean | string; // string indicates the quote used
  commentState: boolean;
  contextStack: string[];
};

const defaultState = (): State => ({
  stringState: false,
  commentState: false,
  contextStack: [],
});

export const languageDefinition = (): ((token: LanguageToken) => string) => {
  const state = defaultState();

  return (token: LanguageToken): string => {
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
      return "string";
    }
    // enter string state
    if (STRINGS.includes(token.text) && state.stringState === false) {
      state.stringState = token.text;
      return "string";
    }
    // are we in string state?
    if (state.stringState) {
      return "string";
    }

    // no special token
    return "token";
  };
};

export const gluePredicate = (token: TypedLanguageToken): boolean => {
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
