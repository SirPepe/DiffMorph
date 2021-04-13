// This module's applyLanguage() function calls language definitions on frames
// of untyped tokens and thereby transforms bits of context-free text into typed
// tokens that can then be diffed, highlighted and rendered. This is one big
// mess of mucking around with doubly-linked lists in-place. Beware of
// applyLanguage() in particular as it WILL modify its input with extreme
// prejudice.

import { getFirstTextToken, hash } from "./util";
import { Box, Decoration, TextToken, TypedToken } from "../types";
import { languages } from "../languages";

// Joins the token in-place so that the glue function can benefit from working
// with already-glued previous tokens.
function applyPostprocessor(token: TypedToken): void {
  const postprocessor =
    token.parent.language && languages[token.parent.language]
      ? languages[token.parent.language].postprocessor
      : languages.none.postprocessor;
  while (true) {
    if (
      token.prev &&
      token.prev.y === token.y &&
      token.parent.hash === token.prev.parent.hash && // don't join across boxes
      postprocessor(token)
    ) {
      const padding = Math.abs(token.prev.x + token.prev.width - token.x);
      token.prev.text += " ".repeat(padding) + token.text;
      token.prev.width += padding + token.width;
      token.prev.hash = hash(hash(token.prev.type) + hash(token.prev.text));
      token.prev.next = token.next;
      // This indexOf() is expensive, but keeping track of the index while the
      // loop runs is cumbersome because tokens are mixed with boxes. So
      // indexOf() is, at least for now, the least worst choice for removing the
      // token from not only the linked list of tokens, but from the flat array
      // of box members as well.
      token.parent.content.splice(token.parent.content.indexOf(token), 1);
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
// TypedTokens.
export const applyLanguage = (
  root: Box<TextToken, Decoration<TextToken>>
): Box<TypedToken, Decoration<TypedToken>> => {
  const languageDefinition =
    root.language && languages[root.language]
      ? languages[root.language]
      : languages.none;
  const language = languageDefinition.definitionFactory({});
  const first: any = getFirstTextToken([root]);
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
  applyPostprocessor(first);
  return root as Box<TypedToken, Decoration<TypedToken>>; // ¯\_(ツ)_/¯
};
