import { BoxToken, isTextToken, LanguageToken, TextToken } from "./types";

const toLanguageToken = (
  source: BoxToken | TextToken,
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
    const languageToken = toLanguageToken(token, x, y);
    if (!first) {
      first = languageToken;
    }
    languageToken.prev = prev;
    if (prev) {
      prev.next = languageToken;
    }
    prev = languageToken;
  }
  return first;
};
