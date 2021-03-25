// This module's applyLanguage() function calls language definitions on frames
// of untyped tokens and thereby transforms bits of context-free text into typed
// tokens that can then be diffed, highlighted and rendered. This is one big
// mess of mucking around with doubly-linked lists in-place. Beware!

import { hash, unwrapFirst } from "./util";
import {
  BoxToken,
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

export const applyLanguage = (
  languageDefinition: LanguageDefinition<Record<string, any>>,
  root: BoxToken<TextToken>
): TypedToken => {
  const language = languageDefinition.definitionFactory({});
  const head: any = unwrapFirst(root);
  let token: any = unwrapFirst(root);
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
  return head;
};
