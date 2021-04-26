// This module's applyLanguage() function calls language definitions on frames
// of untyped tokens and thereby transforms bits of context-free text into typed
// tokens that can then be diffed, highlighted and rendered. This is one big
// mess of mucking around with doubly-linked lists in-place, which explains all
// the "any" in the following lines. Beware of applyLanguage() in particular as
// it WILL modify its input with extreme prejudice.

import {
  createIdGenerator,
  getFirstTextToken,
  hash,
  spliceBoxContent,
} from "./util";
import { Box, Decoration, TextToken, TypedToken } from "../types";
import { languages } from "../languages";

function embeddedLanguageBoxFactory(
  parent: Box<any, any>,
  id: string,
  language: string
): Box<any, any> {
  return {
    kind: "BOX" as const,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    hash: parent.hash + "-embedded-" + language,
    id,
    data: {},
    language,
    content: [],
    decorations: [],
    parent,
  };
}

// Joins the token in-place so that the glue function can benefit from working
// with already-glued previous tokens. The input token may be undefined when
// dealing with an empty string as input.
function applyPostprocessor(token: TypedToken | undefined): void {
  if (!token) {
    return;
  }
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
export function applyLanguage(
  root: Box<TextToken, Decoration<TextToken>>
): Box<TypedToken, Decoration<TypedToken>> {
  const nextEmbeddedId = createIdGenerator();
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
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      if (typeof type === "string") {
        current.type = type;
        current.hash = hash(hash(current.type) + hash(current.text));
        current = current.next;
      } else if (typeof type === "object") {
        // Move embedded languages items into their own box(es) before
        // processing their actual types
        spliceBoxContent(current, type.types.length, (parent) =>
          embeddedLanguageBoxFactory(
            parent,
            nextEmbeddedId(type.language, parent.hash),
            type.language
          )
        );
        // Insert new types into the current type array and re-process the
        // current token with the then-current type
        types.splice(i, 1, ...type.types);
        i--;
      } else {
        throw new Error(
          `Language definition for ${languageDefinition.name} returned ${type} for "${current.text}"`
        );
      }
    }
  }
  applyPostprocessor(first);
  return root as Box<TypedToken, Decoration<TypedToken>>; // ¯\_(ツ)_/¯
}
