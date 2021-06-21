// Implements support for both HTML and XML. XML features are controlled by a
// a flag, which the XML language definition binds to true.

import { isAdjacent, lookaheadText } from "../util";
import { languageDefinition as css } from "./css";
import { languageDefinition as js } from "./javascript";
import {
  EmbeddedLanguageProcessor,
  LanguageDefinition,
  LanguageFunction,
  LanguageFunctionResult,
  LanguageTokens,
  TextTokens,
  TypedTokens,
} from "../types";
import { LanguageTheme, themeColors } from "../language/theme";

type Flags = {
  xml: boolean;
};

const QUOTES = ["'", '"'];
const ATTR_RE = /^[a-z]+[a-z0-9]*$/i;

type State = {
  attrState: false | string; // string indicates the attribute name
  attrValueState: false | string; // string indicates the quote used
  commentState: false | "cdata" | "comment";
  tagState: false | "tag" | "xml";
  tagName: false | string;
  doctypeState: boolean;
};

function defaultState(): State {
  return {
    attrState: false,
    attrValueState: false,
    commentState: false,
    tagState: false,
    tagName: false,
    doctypeState: false,
  };
}

function processInlineCss(attributeEnd: string): EmbeddedLanguageProcessor {
  return {
    languageDefinition: {
      ...css,
      definitionFactory: () => css.definitionFactory({ inline: true }),
    },
    abortPredicate: (next: LanguageTokens) => {
      if (next.text === attributeEnd && next.prev?.text !== "\\") {
        return true;
      }
      return false;
    },
  };
}

function processEmbeddedCss(): EmbeddedLanguageProcessor {
  return {
    languageDefinition: {
      ...css,
      definitionFactory: () => css.definitionFactory({ inline: false }),
    },
    abortPredicate: (next: LanguageTokens) => {
      if (next.text === "<" && lookaheadText<any>(next, ["/", "style", ">"])) {
        // Don't abort when "</style>" is part of a string in the embedded CSS
        if (next.prev?.type?.startsWith("string")) {
          return false;
        } else {
          return true;
        }
      }
      return false;
    },
  };
}

function processEmbeddedJavaScript(): EmbeddedLanguageProcessor {
  return {
    languageDefinition: {
      ...js,
      definitionFactory: () => js.definitionFactory(),
    },
    abortPredicate: (next: LanguageTokens) => {
      if (next.text === "<" && lookaheadText<any>(next, ["/", "script", ">"])) {
        // Don't abort when "</script>" is part of a string in the embedded JS
        if (next.prev?.type.startsWith("string")) {
          return false;
        } else {
          return true;
        }
      }
      return false;
    },
  };
}

function defineHTML(flags: Flags = { xml: false }): LanguageFunction {
  const state = defaultState();
  const { xml } = flags;

  return (token: LanguageTokens): LanguageFunctionResult => {
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
        return "comment cdata";
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
      lookaheadText<TextTokens>(token, ["]", ">"])
    ) {
      state.commentState = false;
      return ["comment cdata", "comment cdata", "comment cdata"];
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
      return "comment cdata";
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
        state.tagState = "xml";
        return ["tag-xml", "tag-xml", "tag-xml"];
      }
      state.tagName = "";
      state.tagState = "tag";
      return "tag";
    }
    // exit XML declarations
    if (
      state.tagState === "xml" &&
      token.text === "?" &&
      token?.next?.text === ">"
    ) {
      state.tagState = false;
      return ["tag-xml", "tag-xml"];
    }
    // exit tag state
    if (state.tagState && token.text === ">") {
      state.tagState = false;
      // Handle embedded CSS
      if (
        !xml &&
        state.tagName === "style" &&
        token?.prev?.prev?.text !== "/" // don't switch to CSS after </style>
      ) {
        state.tagName = false;
        return ["tag", processEmbeddedCss()];
      }
      // Handle embedded JS
      if (
        !xml &&
        state.tagName === "script" &&
        token?.prev?.prev?.text !== "/" // don't switch to JS after </script>
      ) {
        state.tagName = false;
        return ["tag", processEmbeddedJavaScript()];
      }
      state.tagName = false;
      return "tag";
    }

    // handle tag contents
    if (state.tagState) {
      // Continue after namespace operator in XML mode
      if (xml && token.prev?.type?.match(/\snamespace/)) {
        if (token?.prev.prev) {
          return token?.prev.prev.type;
        }
      }

      // exit attribute value state on matching quote
      if (token.text === state.attrValueState) {
        state.attrState = false;
        state.attrValueState = false;
        if (state.tagState === "xml") {
          return "value-xml";
        } else {
          return "value";
        }
      }

      // enter attribute value state
      if (QUOTES.includes(token.text) && state.attrValueState === false) {
        state.attrValueState = token.text;
        if (
          !xml &&
          token.next &&
          token?.prev?.prev?.type === "attribute" &&
          token?.prev?.prev?.text === "style"
        ) {
          return ["value", processInlineCss(token.text)];
        }
        if (state.tagState === "xml") {
          return "value-xml";
        } else {
          return "value";
        }
      }

      // are we in attribute value state?
      if (state.attrValueState) {
        if (state.tagState === "xml") {
          return "value-xml";
        } else {
          return "value";
        }
      }

      // custom element tags contain dashes
      if (token.text === "-" && token?.prev?.type === "tag") {
        state.tagName += token.text;
        return "tag";
      }

      // self-closing slash
      if (token.text === "/") {
        return "tag";
      }

      // Tag namespace
      if (xml && token.text === ":") {
        state.tagName += token.text;
        const namespaceFor = token.prev?.type || "none";
        if (state.tagState === "xml") {
          return `operator-xml namespace-${namespaceFor}`;
        } else {
          return `operator namespace-${namespaceFor}`;
        }
      }

      // Attribute value coming up
      if (token.text === "=") {
        if (state.tagState === "xml") {
          return "operator-xml";
        } else {
          return "operator";
        }
      }

      // Attribute value
      if (
        token.text.match(ATTR_RE) &&
        token.prev &&
        token.prev.text === "=" &&
        token.prev.type === "operator"
      ) {
        if (state.tagState === "xml") {
          return "value-xml";
        } else {
          return "value";
        }
      }

      // Consume actual tag name. The tag name must be modified to, at the end
      // of the tag, include the whole tag name so that we can determine when to
      // switch to another language (eg. CSS, JS).
      if (
        token.prev &&
        token.prev.type === "tag" &&
        isAdjacent(token.prev, token)
      ) {
        if (state.tagState === "tag") {
          state.tagName = token.text;
        } else {
          state.tagName += token.text;
        }
        return "tag";
      } else {
        state.attrState = state.attrState
          ? state.attrState + token.text
          : token.text;
        if (state.tagState === "xml") {
          return "attribute-xml";
        } else {
          return "attribute";
        }
      }
    }

    // no special token
    return "token";
  };
}

function glueHTML(token: TypedTokens): boolean {
  // Fuse XML tags
  if (token.type === "tag-xml") {
    return isAdjacent(token, token.prev);
  }
  // Fuse custom element tags
  if (
    token.type === "tag" &&
    (token.text.startsWith("-") || token?.prev?.text.endsWith("-"))
  ) {
    return isAdjacent(token, token.prev);
  }
  // Fuse attribute names
  if (token.type.startsWith("attribute")) {
    return isAdjacent(token, token.prev);
  }
  // Fuse closing slashes to end tags' closing bracket
  if (token.type === "tag" && token.text === "/" && token.prev?.text === "<") {
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
      token?.prev?.prev?.type?.startsWith("operator namespace") &&
      token?.prev?.prev?.prev?.text.startsWith("</")
    ) {
      return true;
    }
  }
  // Fuse opening tag names to opening brackets
  if (token.type === "tag" && token?.prev?.text === "<") {
    return true;
  }
  // Join comments that are directly adjacent, such as "<" and "!" or "foo", "-"
  // and "bar"
  if (token.type === "comment" && token?.prev?.type === "comment") {
    return isAdjacent(token, token.prev);
  }
  // Fuse non-quote bits of attribute values
  if (
    token.type.startsWith("value") &&
    !QUOTES.includes(token.text) &&
    token.prev &&
    token.prev.type === token.type &&
    !QUOTES.includes(token.prev.text)
  ) {
    return true;
  }
  return false;
}

const theme: LanguageTheme = {
  doctype: {
    color: themeColors.comment,
    "font-weight": "bold",
  },
  tag: {
    color: themeColors.tag,
    "font-weight": "bold",
  },
  attribute: {
    color: themeColors.number,
  },
  value: {
    color: themeColors.string,
  },
  "tag-xml": {
    color: themeColors.type,
    "font-weight": "bold",
    "font-style": "italic",
  },
  "attribute-xml": {
    color: themeColors.type,
    "font-style": "italic",
  },
  "value-xml": {
    color: themeColors.type,
    "font-style": "italic",
  },
  comment: {
    color: themeColors.comment,
    "font-style": "italic",
  },
};

export const languageDefinition: LanguageDefinition<Flags> = {
  name: "html",
  theme,
  definitionFactory: defineHTML,
  postprocessor: glueHTML,
};
