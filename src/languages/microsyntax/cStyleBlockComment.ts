import {
  EmbeddedLanguageProcessor,
  LanguageDefinition,
  LanguageTokens,
  TypedTokens,
} from "../../types";
import { isAdjacent } from "../../lib/languages";

const syntax: LanguageDefinition<Record<string, never>> = {
  name: "c-style-block-comment",
  theme: {},
  definitionFactory: () => () => "comment",
  postprocessor: (token: TypedTokens) => {
    if (token.text === "/" && token.prev?.text === "*") {
      return isAdjacent(token, token.prev);
    }
    if (token.text === "*" && token.prev?.text === "/") {
      return isAdjacent(token, token.prev);
    }
    return false;
  },
};

function start(token: LanguageTokens): boolean {
  return (
    token.text === "/" &&
    token?.next?.text === "*" &&
    isAdjacent(token, token.next)
  );
}

function process(): EmbeddedLanguageProcessor {
  return {
    languageDefinition: syntax,
    abortPredicate: (next: LanguageTokens) => {
      if (next.prev?.text === "/" && next.prev?.prev?.text === "*") {
        return isAdjacent(next.prev, next.prev?.prev);
      }
      return false;
    },
  };
}

export const cStyleBlockComment = { start, process, syntax };
