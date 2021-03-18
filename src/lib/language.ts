// This module's applyLanguage() function calls language definitions on frames
// of untyped tokens and thereby transforms bits of context-free text into typed
// tokens that can then be diffed, highlighted and rendered. This is one big
// mess of mucking around with doubly-linked lists in-place. Beware!

import { hash, last } from "./util";
import {
  BoxToken,
  isTextToken,
  RawToken,
  TypedToken,
  TextToken,
  LanguageDefinition,
  LanguagePostprocessor,
} from "../types";

function toRawToken(
  source: BoxToken | TextToken,
  parent: BoxToken,
  x: number,
  y: number
): RawToken {
  if (isTextToken(source)) {
    return {
      ...source,
      size: source.text.length,
      x: source.x + x,
      y: source.y + y,
      next: undefined,
      prev: undefined,
      source,
      parent,
    };
  } else {
    return toRawTokens(source, source.x, source.y);
  }
}

export function toRawTokens(root: BoxToken, x = 0, y = 0): RawToken {
  let head: RawToken | undefined;
  let tail: RawToken | undefined;
  for (const token of root.tokens) {
    const languageToken = toRawToken(token, root, x, y);
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
}

function flattenTypedTokens(token: TypedToken | undefined): TypedToken[] {
  const result: TypedToken[] = [];
  while (token) {
    result.push({ ...token, prev: undefined, next: undefined });
    token = token.next;
  }
  return result;
}

// Joins the token in-place so that the glue function can benefit from working
// with already-glued previous tokens.
function applyPostprocessor(
  token: TypedToken,
  postprocessor: LanguagePostprocessor
): void {
  while (true) {
    if (
      token.prev &&
      postprocessor(token) &&
      token.parent.hash === token.prev.parent.hash // don't join across boxes
    ) {
      token.prev.text += token.text;
      token.prev.size += token.size;
      token.prev.hash = hash(hash(token.prev.type) + hash(token.prev.text));
      token.prev.next = token.next;
      if (token.next) {
        token.next.prev = token.prev;
      }
    }
    if (token.next) {
      token = token.next;
    } else {
      return;
    }
  }
}

// Returns tokens as an array for easier diffing. The tokens are still linked to
// each other as that is important for other bits of the program.
export const applyLanguage = (
  languageDefinition: LanguageDefinition<Record<string, any>>,
  inputBox: BoxToken
): TypedToken[] => {
  const root = toRawTokens(inputBox);
  const language = languageDefinition.definitionFactory({});
  const head: any = root;
  let token: any = root;
  while (token) {
    const results = language(token);
    const types = Array.isArray(results) ? results : [results];
    while (types.length > 0) {
      const type = types.shift();
      token.type = type;
      token.hash = hash(hash(token.type) + hash(token.text));
      token = token.next;
    }
  }
  applyPostprocessor(head, languageDefinition.postprocessor);
  return flattenTypedTokens(head);
};
