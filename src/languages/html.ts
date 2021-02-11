import { isAdjacent } from "../lib";
import { LanguageToken, TypedLanguageToken } from "../types";

const QUOTES = ["'", '"'];
const ATTR_RE = /^[a-z]+[a-z0-9]*$/i;

type State = {
  attrState: boolean | string; // string indicates the quote used
  commentState: boolean;
  tagState: boolean;
  doctypeState: boolean;
};

const defaultState = (): State => ({
  attrState: false,
  commentState: false,
  tagState: false,
  doctypeState: false,
});

export const languageDefinition = (): ((token: LanguageToken) => string) => {
  const state = defaultState();

  return (token: LanguageToken): string => {
    // handle comments and doctypes
    if (
      state.commentState === false &&
      token.text === "<" &&
      token?.next?.text === "!"
    ) {
      if (token?.next?.next?.text.toLowerCase() === "doctype") {
        state.doctypeState = true;
        return "doctype";
      } else {
        state.commentState = true;
        return "comment";
      }
    }
    if (state.doctypeState === true && token.text === ">") {
      state.doctypeState = false;
      return "doctype";
    }
    if (
      state.commentState === true &&
      token.text === ">" &&
      token?.prev?.text === "-" &&
      isAdjacent(token, token.prev) &&
      token?.prev?.prev?.text === "-" &&
      isAdjacent(token.prev, token.prev.prev)
    ) {
      state.commentState = false;
      return "comment";
    }
    if (state.commentState === true) {
      return "comment";
    }
    if (state.doctypeState === true) {
      return "doctype";
    }

    // handle tags
    if (state.tagState === false && token.text === "<") {
      state.tagState = true;
      return "tag";
    }
    if (state.tagState === true && token.text === ">") {
      state.tagState = false;
      return "tag";
    }
    if (state.tagState === true) {
      // exit attribute value state
      if (token.text === state.attrState) {
        state.attrState = false;
        return "value";
      }
      // enter attribute value state
      if (QUOTES.includes(token.text) && state.attrState === false) {
        state.attrState = token.text;
        return "value";
      }
      // are we in attribute value state?
      if (state.attrState) {
        return "value";
      }
      // custom element tags contain dashes
      if (token.text === "-") {
        return "tag";
      }
      // self-closing slash
      if (token.text === "/") {
        return "tag";
      }
      if (token.text === "=") {
        return "operator";
      }

      if (
        token.text.match(ATTR_RE) &&
        token.prev &&
        token.prev.text === "=" &&
        token.prev.type === "operator"
      ) {
        return "value";
      }
      if (token.prev && isAdjacent(token.prev, token)) {
        return "tag";
      } else {
        return "attribute";
      }
    }

    // no special token
    return "token";
  };
};

const gluePredicate = (token: TypedLanguageToken): boolean => {
  // Fuse closing slashes to end tags' closing bracket
  if (
    token.type === "tag" &&
    token.text === "/" &&
    token.prev &&
    token.prev.type === "tag" &&
    token.prev.text === "<"
  ) {
    return true;
  }
  // Fuse closing brackets to self-closing tags
  if (
    token.type === "tag" &&
    token.text === ">" &&
    token?.prev?.text.endsWith("/")
  ) {
    return true;
  }
  // Fuse closing tag names to opening brackets and closing slash
  if (token.type === "tag" && token?.prev?.text.startsWith("</")) {
    return true;
  }
  // Fuse opening tag names to opening brackets
  if (token.type === "tag" && token?.prev?.text === "<") {
    return true;
  }
  if (token.type === "comment" && isAdjacent(token, token.prev)) {
    if (token.text === "!" && token?.prev?.text === "<") {
      return true;
    }
    if (token.text === "-" && token?.prev?.text.startsWith("<!")) {
      return true;
    }
    if (
      token.text === "-" &&
      token?.prev?.text === "-" &&
      token?.next?.text === ">"
    ) {
      return true;
    }
    if (token.text === ">" && token?.prev?.text === "--") {
      return true;
    }
    return false;
  }
  // Fuse non-quote bits of attribute values
  if (
    token.type === "value" &&
    !QUOTES.includes(token.text) &&
    token.prev &&
    token.prev.type === "value" &&
    !QUOTES.includes(token.prev.text)
  ) {
    return true;
  }
  return false;
};

export default {
  id: "html",
  languageDefinition,
  gluePredicate,
};
