import {
  EmbeddedLanguageProcessor,
  LanguageDefinition,
  LanguageTokens,
  TypedTokens,
} from "../../types";
import { isAdjacent } from "../../util";

const syntax: LanguageDefinition<Record<string, never>> = {
  name: "html-style-comment",
  theme: {},
  definitionFactory: () => () => "comment",
  postprocessor: (token: TypedTokens) => isAdjacent(token, token.prev),
};

function start(token: LanguageTokens): boolean {
  return (
    token.text === "<" &&
    token.next?.text === "!" &&
    isAdjacent(token, token.next) &&
    token.next?.next?.text === "-" &&
    isAdjacent(token.next, token.next.next) &&
    token.next?.next?.next?.text === "-" &&
    isAdjacent(token.next.next, token.next.next.next)
  );
}

function process(): EmbeddedLanguageProcessor {
  return {
    languageDefinition: syntax,
    abortPredicate: (next: LanguageTokens) => {
      if (
        next.prev?.text === ">" &&
        next.prev?.prev?.text === "-" &&
        next.prev?.prev?.prev?.text === "-"
      ) {
        return (
          isAdjacent(next.prev, next.prev.prev) &&
          isAdjacent(next.prev.prev, next.prev.prev.prev)
        );
      }
      return false;
    },
  };
}

export const htmlStyleComment = { start, process, syntax };
