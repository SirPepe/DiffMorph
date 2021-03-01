// Implements support for both HTML and XML. XML features are controlled by a
// a flag, which the XML language definition bind to true.

import { isAdjacent, lookaheadText } from "../lib";
import { LanguageToken, TypedLanguageToken } from "../types";

type Flags = {
  xml: boolean;
};

const QUOTES = ["'", '"'];
const ATTR_RE = /^[a-z]+[a-z0-9]*$/i;

type State = {
  attrState: boolean | string; // string indicates the quote used
  xmlDeclarationState: boolean; // when true, tag state must also be true
  commentState: false | "cdata" | "comment";
  tagState: boolean;
  doctypeState: boolean;
};

const defaultState = (): State => ({
  attrState: false,
  xmlDeclarationState: false,
  commentState: false,
  tagState: false,
  doctypeState: false,
});

export const languageDefinition = (
  flags: Flags = { xml: false }
): ((token: LanguageToken) => string | string[]) => {
  const state = defaultState();
  const { xml } = flags;

  return (token: LanguageToken): string | string[] => {
    // handle comments and doctypes
    if (
      state.commentState === false &&
      token.text === "<" &&
      token?.next?.text === "!"
    ) {
      if (token?.next?.next?.text.toLowerCase() === "doctype") {
        state.doctypeState = true;
        return "doctype";
      } else if (xml && token?.next?.next?.text === "[") {
        state.commentState = "cdata";
        return "comment-cdata";
      } else {
        state.commentState = "comment";
        return "comment";
      }
    }
    // exit doctype state
    if (state.doctypeState === true && token.text === ">") {
      state.doctypeState = false;
      return "doctype";
    }
    // exit cdata state
    if (
      state.commentState === "cdata" &&
      token.text === "]" &&
      lookaheadText(token, 2, ["]", ">"])
    ) {
      state.commentState = false;
      return ["comment-cdata", "comment-cdata", "comment-cdata"];
    }
    // exit regular comment state
    if (
      state.commentState &&
      token.text === ">" &&
      token?.prev?.text === "-" &&
      isAdjacent(token, token.prev) &&
      token?.prev?.prev?.text === "-" &&
      isAdjacent(token.prev, token.prev.prev)
    ) {
      state.commentState = false;
      return "comment";
    }
    if (state.commentState === "cdata") {
      return "comment-cdata";
    }
    if (state.commentState === "comment") {
      return "comment";
    }
    if (state.doctypeState === true) {
      return "doctype";
    }

    // handle tags
    if (state.tagState === false && token.text === "<") {
      state.tagState = true;
      if (
        xml &&
        token?.next?.text === "?" &&
        token?.next?.next?.text === "xml"
      ) {
        state.xmlDeclarationState = true;
        return ["tag-xml", "tag-xml", "tag-xml"];
      }
      return "tag";
    }
    if (
      state.tagState === true &&
      state.xmlDeclarationState === true &&
      token.text === "?" &&
      token?.next?.text === ">"
    ) {
      state.tagState = false;
      state.xmlDeclarationState = false;
      return ["tag-xml", "tag-xml"];
    }
    if (state.tagState === true && token.text === ">") {
      state.tagState = false;
      return "tag";
    }
    if (state.tagState === true) {
      // Continue after namespace operator
      if (xml && token.prev?.type === "operator-namespace") {
        if (token?.prev.prev) {
          return token?.prev.prev.type;
        }
      }
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
      // Namespace
      if (xml && token.text === ":") {
        return "operator-namespace";
      }
      // Attribute value coming up
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

export const gluePredicate = (token: TypedLanguageToken): boolean => {
  // Fuse XML tags
  if (token.type === "tag-xml" && token?.prev?.type === "tag-xml") {
    return true;
  }
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
  if (token.type === "tag") {
    if (token?.prev?.text.startsWith("</")) {
      return true;
    }
    if (
      token?.prev?.prev?.type === "operator-namespace" &&
      token?.prev?.prev?.prev?.text.startsWith("</")
    ) {
      return true;
    }
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
