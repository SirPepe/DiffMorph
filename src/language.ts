import { BoxToken, isTextToken, LanguageToken, TextToken } from "./types";

const toLanguageToken = (
  source: BoxToken | TextToken,
  parent: BoxToken,
  x: number,
  y: number
): LanguageToken => {
  if (isTextToken(source)) {
    return {
      ...source,
      x: source.x + x,
      y: source.y + y,
      next: undefined,
      prev: undefined,
      source,
      parent,
    };
  } else {
    return toLanguageTokens(source, source.x, source.y);
  }
};

export const toLanguageTokens = (
  root: BoxToken,
  x = 0,
  y = 0
): LanguageToken => {
  let first: LanguageToken | undefined;
  let prev: LanguageToken | undefined;
  for (const token of root.tokens) {
    const languageToken = toLanguageToken(token, root, x, y);
    if (!first) {
      first = languageToken;
    }
    languageToken.prev = prev;
    if (prev) {
      prev.next = languageToken;
    }
    prev = languageToken;
  }
  if (!first) {
    throw new Error("Can't create language tokens from empty box");
  }
  return first;
};

/*export const applyLanguage = (
  definitionFactory: () => (token: LanguageToken) => string,
  gluePredicate: (token: TypedLanguageToken) => boolean,
  input: LanguageToken
): TypedToken[] => {
  const language = definitionFactory();
  return joinedTokens;
};*/
