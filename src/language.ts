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
    // TypeScript rightfully complains about the following line, as "tail" is
    // NOT a TypedLanguageToken as required by LanguageToken's type. But this is
    // only a "problem" (as far as the type system is concerned) between this
    // assignment and the tokens getting processed by the language definition
    // function, which gets fed the output from this function without _any_
    // intermediate steps and mutates prev into a TypedLanguageToken. The error
    // is just a side effect of splitting applyLanguageDefinition() and
    // toLanguageTokens() into two functions and can thus be ignored without any
    // risk of breakage. The unit tests for languages (especially HTML) would
    // fail if this were to cause any problem.
    languageToken.prev = tail as any;
    tail.next = languageToken;
    tail = last(tail);
  }
  if (!head) {
    throw new Error("Can't create language tokens from empty box");
  }
  return head;
};

const applyLanguageDefinition = (
  language: (token: LanguageToken) => string | string[],
  input: LanguageToken
): TypedLanguageToken => {
  const head: any = input;
  let token: any = input;
  while (token) {
    const type = language(token);
    if (Array.isArray(type)) {
      while (token && type.length > 0) {
        token.type = type.shift();
        token = token.next;
      }
    } else {
      token.type = type;
      token = token.next;
    }
  }
  return head;
};

const toTypedTokens = (token: TypedLanguageToken | undefined): TypedToken[] => {
  const result: TypedToken[] = [];
  while (token) {
    result.push({
      x: token.x,
      y: token.y,
      text: token.text,
      type: token.type,
      hash: token.hash,
      parent: token.parent,
    });
    token = token.next;
  }
  return result;
};

export const applyLanguage = (
  definitionFactory: () => (token: LanguageToken) => string | string[],
  gluePredicate: (token: TypedLanguageToken) => boolean,
  tokens: (BoxToken | TextToken)[]
): TypedToken[] => {
  const rootBox =
    tokens.length === 1 && !isTextToken(tokens[0])
      ? tokens[0]
      : { x: 0, y: 0, tagName: "", hash: "", attributes: [], tokens };
  const firstTyped = applyLanguageDefinition(
    definitionFactory(),
    toLanguageTokens(rootBox)
  );
  // This joins the token in-place so that the glue function can benefit from
  // working with already-glued previous tokens.
  let token: TypedLanguageToken | undefined = firstTyped;
  while (token) {
    if (
      token.prev &&
      gluePredicate(token) &&
      token.parent.hash === token.prev.parent.hash // don't join across boxes
    ) {
      token.prev.text += token.text;
      token.prev.hash = hash(hash(token.prev.type) + hash(token.prev.text));
      token.prev.next = token.next;
      if (token.next) {
        token.next.prev = token.prev;
      }
    }
    token = token.next;
  }
  return toTypedTokens(firstTyped);
};
