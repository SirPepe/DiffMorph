// This module's applyLanguage() function calls language definitions on frames
// of untyped tokens and thereby transforms bits of context-free text into typed
// tokens that can then be diffed, highlighted and rendered. This is one big
// mess of mucking around with doubly-linked lists in-place. Beware of
// applyLanguage() in particular as it WILL modify its input with extreme
// prejudice.

import { hash, unwrapFirst } from "./util";
import {
  Box,
  TypedToken,
  LanguageDefinition,
  LanguagePostprocessor,
  TextToken,
} from "../types";

// Joins the token in-place so that the glue function can benefit from working
// with already-glued previous tokens.
function applyPostprocessor(
  token: TypedToken,
  postprocessor: LanguagePostprocessor
): void {
  let index = 0;
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
      token.parent.tokens.splice(index, 1);
      if (token.next) {
        token.next.prev = token.prev;
      }
    } else {
      index++; // no increment if we've just removed a token
    }
    if (token.next) {
      token = token.next;
    } else {
      return;
    }
  }
}

// Performs all of its actions in-place
export const applyLanguage = (
  languageDefinition: LanguageDefinition<Record<string, any>>,
  root: Box<TextToken>
): Box<TypedToken> => {
  const language = languageDefinition.definitionFactory({});
  const first: any = unwrapFirst(root);
  let current: any = unwrapFirst(root);
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
