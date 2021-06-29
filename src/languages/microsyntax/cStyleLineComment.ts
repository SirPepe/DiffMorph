import {
  EmbeddedLanguageProcessor,
  LanguageDefinition,
  LanguageTokens,
  TypedTokens,
} from "../../types";
import { isAdjacent } from "../../lib/languages";

const syntax: LanguageDefinition<Record<string, never>> = {
  name: "c-style-line-comment",
  theme: {},
  definitionFactory: () => () => "comment",
  postprocessor: (token: TypedTokens) => {
    if (token.text === "/" && token.prev?.text === "/") {
      return isAdjacent(token, token.prev);
    }
    return false;
  },
};

function start(token: LanguageTokens): boolean {
  return (
    token.text === "/" &&
    token?.next?.text === "/" &&
    isAdjacent(token, token.next)
  );
}

function process(): EmbeddedLanguageProcessor {
  return {
    languageDefinition: syntax,
    abortPredicate: (next: LanguageTokens) => {
      if (next.prev && next.prev.y < next.y) {
        return true;
      }
      return false;
    },
  };
}

export const cStyleLineComment = { start, process, syntax };
