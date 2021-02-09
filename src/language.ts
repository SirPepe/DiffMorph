import { hash, last } from "./lib";
import {
  BoxToken,
  isTextToken,
  LanguageToken,
  TextToken,
  TypedLanguageToken,
  TypedToken,
} from "./types";

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
  let head: LanguageToken | undefined;
  let tail: LanguageToken | undefined;
  for (const token of root.tokens) {
    const languageToken = toLanguageToken(token, root, x, y);
    if (!head || !tail) {
      head = tail = languageToken;
      continue;
    }
    languageToken.prev = tail;
    tail.next = languageToken;
    tail = last(tail);
  }
  if (!head) {
    throw new Error("Can't create language tokens from empty box");
  }
  return head;
};

const applyLanguageDefinition = (
  language: (token: LanguageToken) => string,
  input: LanguageToken
): TypedLanguageToken => {
  const head: any = input;
  let token: any = input;
  while (token) {
    token.type = language(token);
    token = token.next;
  }
  return head;
};

export const applyLanguage = (
  definitionFactory: () => (token: LanguageToken) => string,
  gluePredicate: (token: TypedLanguageToken) => boolean,
  tokens: (BoxToken | TextToken)[]
): TypedToken[] => {
  const rootBox =
    tokens.length === 1 && !isTextToken(tokens[0])
      ? tokens[0]
      : { x: 0, y: 0, tagName: "", hash: "", attributes: [], tokens };
  const typed = applyLanguageDefinition(
    definitionFactory(),
    toLanguageTokens(rootBox)
  );
  const joined: TypedToken[] = [];
  let token: TypedLanguageToken | undefined = typed;
  while (token) {
    if (joined.length > 0 && gluePredicate(token)) {
      joined[joined.length - 1].text += token.text;
    } else {
      if (joined.length > 0) {
        const last = joined[joined.length - 1];
        last.hash = hash(hash(last.type) + hash(last.text));
      }
      joined.push({
        ...token.source,
        parent: token.parent,
        type: token.type,
        hash: "", // filled when the next token is processed
      });
    }
    token = token.next;
  }
  return joined;
};
