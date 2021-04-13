// Implements support for both HTML and XML. XML features are controlled by a
// a flag, which the XML language definition binds to true.

import { isAdjacent, lookaheadText } from "../lib/util";
import { languageDefinition as css } from "./css";
import {
  EmbeddedLanguageFunctionResult,
  LanguageDefinition,
  LanguageFunction,
  LanguageFunctionResult,
  RawToken,
  TypedToken,
} from "../types";

type Flags = {
  xml: boolean;
};

const QUOTES = ["'", '"'];
const ATTR_RE = /^[a-z]+[a-z0-9]*$/i;

type State = {
  attrState: false | string; // string indicates the attribute name
  attrValueState: false | string; // string indicates the quote used
  commentState: false | "cdata" | "comment";
  tagState: false | string; // string indicates the current tag
  doctypeState: boolean;
};

function defaultState(): State {
  return {
    attrState: false,
    attrValueState: false,
    commentState: false,
    tagState: false,
    doctypeState: false,
  };
}

function processInlineCss(
  start: RawToken,
  attributeEnd: string
): EmbeddedLanguageFunctionResult {
  const language = css.definitionFactory({ inline: true });
  const types = [];
  let current: any = start;
  while (current && current.text !== attributeEnd) {
    const results = language(current);
    const resultTypes = Array.isArray(results) ? results : [results];
    for (const type of resultTypes) {
      types.push(type);
      current = current.next;
    }
  }
  return { language: "css", types };
}

function defineHTML(flags: Flags = { xml: false }): LanguageFunction {
  const state = defaultState();
  const { xml } = flags;

  return (token: RawToken): LanguageFunctionResult => {
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
      lookaheadText(token, ["]", ">"])
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

    // handle tag state entry
    if (state.tagState === false && token.text === "<") {
      if (
        xml &&
        token?.next?.text === "?" &&
        token?.next?.next?.text === "xml"
      ) {
        state.tagState = "__XML_DECLARATION__";
        return ["tag-xml", "tag-xml", "tag-xml"];
      }
      state.tagState = "tag";
      return "tag";
    }
    // exit XML declarations
    if (
      state.tagState === "__XML_DECLARATION__" &&
      token.text === "?" &&
      token?.next?.text === ">"
    ) {
      state.tagState = false;
      return ["tag-xml", "tag-xml"];
    }
    // exit tag state
    if (state.tagState && token.text === ">") {
      state.tagState = false;
      return "tag";
    }
    // handle tag contents
    if (state.tagState) {
      // Continue after namespace operator
      if (xml && token.prev?.type === "operator-namespace") {
        if (token?.prev.prev) {
          return token?.prev.prev.type;
        }
      }

      // exit attribute value state on matching quote
      if (token.text === state.attrValueState) {
        state.attrState = false;
        state.attrValueState = false;
        return "value";
      }

      // enter attribute value state
      if (QUOTES.includes(token.text) && state.attrValueState === false) {
        state.attrValueState = token.text;
        if (
          token.next &&
          token?.prev?.prev?.type === "attribute" &&
          token?.prev?.prev?.text === "style"
        ) {
          return ["value", processInlineCss(token.next, token.text)];
        }
        return "value";
      }

      // are we in attribute value state?
      if (state.attrValueState) {
        return "value";
      }

      // custom element tags contain dashes
      if (token.text === "-" && token?.prev?.type === "tag") {
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

      // Attribute value
      if (
        token.text.match(ATTR_RE) &&
        token.prev &&
        token.prev.text === "=" &&
        token.prev.type === "operator"
      ) {
        return "value";
      }
      // Consume actual tag name. The tag state must be modified to, at the end
      // of the tag, include the whole tag name so that we can determine when to
      // switch to another language (eg. CSS, JS).
      if (
        token.prev &&
        token.prev.type === "tag" &&
        isAdjacent(token.prev, token)
      ) {
        if (state.tagState === "tag") {
          state.tagState = token.text;
        } else {
          state.tagState += token.text;
        }
        return "tag";
      } else {
        state.attrState = state.attrState
          ? state.attrState + token.text
          : token.text;
        return "attribute";
      }
    }

    // no special token
    return "token";
  };
}

function glueHTML(token: TypedToken): boolean {
  // Fuse XML tags
  if (token.type === "tag-xml" && token?.prev?.type === "tag-xml") {
    return true;
  }
  // Fuse custom element tags
  if (
    token.type === "tag" &&
    (token.text.startsWith("-") || token?.prev?.text.endsWith("-")) &&
    token?.prev?.type === "tag"
  ) {
    return true;
  }
  // Fuse attribute names
  if (
    token.type === "attribute" &&
    token?.prev?.type === "attribute" &&
    isAdjacent(token, token.prev)
  ) {
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
  if (token.type === "tag" && token.text !== "<") {
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
}

export const languageDefinition: LanguageDefinition<Flags> = {
  name: "html",
  definitionFactory: defineHTML,
  postprocessor: glueHTML,
};
