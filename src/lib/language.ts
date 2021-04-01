// This module's applyLanguage() function calls language definitions on frames
// of untyped tokens and thereby transforms bits of context-free text into typed
// tokens that can then be diffed, highlighted and rendered. This is one big
// mess of mucking around with doubly-linked lists in-place. Beware of
// applyLanguage() in particular as it WILL modify its input with extreme
// prejudice.

import { getFirstTextToken, hash } from "./util";
import {
  Box,
  Highlight,
  LanguageDefinition,
  LanguagePostprocessor,
  TextToken,
  TypedToken,
} from "../types";

// Joins the token in-place so that the glue function can benefit from working
// with already-glued previous tokens.
function applyPostprocessor(
  token: TypedToken,
  postprocessor: LanguagePostprocessor
): void {
  while (true) {
    if (
      token.prev &&
      token.prev.y === token.y &&
      token.parent.hash === token.prev.parent.hash && // don't join across boxes
      postprocessor(token)
    ) {
      const padding = Math.abs(token.prev.x + token.prev.size - token.x);
      token.prev.text += " ".repeat(padding) + token.text;
      token.prev.size += padding + token.size;
      token.prev.hash = hash(hash(token.prev.type) + hash(token.prev.text));
      token.prev.next = token.next;
      // This indexOf() is expensive, but keeping track of the index while the
      // loop runs is cumbersome because tokens are mixed with highlights. So
      // indexOf() is the least worst choice for removing the token from not
      // only the linked list of tokens, but from the flat array of box members
      // also.
      token.parent.tokens.splice(token.parent.tokens.indexOf(token), 1);
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

// Performs all of its actions in-place, essentially upgrading the TextTokens to
// TypedTokens without ever touching the MetaTokens.
export const applyLanguage = (
  languageDefinition: LanguageDefinition<Record<string, any>>,
  root: Box<TextToken | Highlight>
): Box<TypedToken | Highlight> => {
  const language = languageDefinition.definitionFactory({});
  const first: any = getFirstTextToken([ root ]);
  let current: any = first;
  while (current) {
    const results = language(current);
    const types = Array.isArray(results) ? results : [results];
    while (types.length > 0) {
      const type = types.shift();
      current.type = type;
      current.hash = hash(hash(current.type) + hash(current.text));
      current = current.next;
    }
  }
  applyPostprocessor(first, languageDefinition.postprocessor);
  return root as Box<TypedToken>; // ¯\_(ツ)_/¯
};
