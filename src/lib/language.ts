// This module's applyLanguage() function calls language definitions on frames
// of untyped tokens and thereby transforms bits of context-free text into typed
// tokens that can then be diffed, highlighted and rendered. This is one big
// mess of mucking around with doubly-linked lists in-place, which explains all
// the "any" in the following lines. Beware of applyLanguage() in particular as
// it WILL modify its input with extreme prejudice.

import { getFirstTextToken, spliceBoxContent } from "./util";
import {
  Box,
  Decoration,
  EmbeddedLanguageFunctionResult,
  LanguagePostprocessor,
  TextTokens,
  TokenReplacementResult,
  TypedTokens,
} from "../types";
import { languages } from "../languages";

function isEmbeddedLanguageResult(x: any): x is EmbeddedLanguageFunctionResult {
  if (x && "language" in x) {
    return true;
  }
  return false;
}

function isTokenReplacementResult(x: any): x is TokenReplacementResult {
  if (x && "replacements" in x) {
    return true;
  }
  return false;
}

function embeddedLanguageBoxFactory(
  parent: Box<any, any>,
  language: string
): Box<any, any> {
  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    data: {
      embedded: `embedded Ͼ ${language}`,
    },
    language,
    content: [],
    decorations: [],
    parent,
  };
}

// Joins the token in-place so that the glue function can benefit from working
// with already-glued previous tokens. The input token may be undefined when
// dealing with an empty string as input.
function applyPostprocessor(token: TypedTokens | undefined): void {
  if (!token) {
    return;
  }
  while (true) {
    // The postprocessor can potentially be different on a per-token basis
    // because embedded languages are a thing.
    const postprocessor: LanguagePostprocessor =
      token.parent.language && languages[token.parent.language]
        ? languages[token.parent.language].postprocessor
        : languages.none.postprocessor;
    if (
      token.prev &&
      token.prev.y === token.y &&
      token.prev.type === token.type && // don't join non-equal types
      token.parent === token.prev.parent && // don't join across boxes
      postprocessor(token)
    ) {
      const padding = Math.abs(token.prev.x + token.prev.width - token.x);
      token.prev.text += " ".repeat(padding) + token.text;
      token.prev.width += padding + token.width;
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
  root: Box<TextTokens, Decoration<TextTokens>>
): Box<TypedTokens, Decoration<TypedTokens>> {
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
        current = current.next;
      } else if (isEmbeddedLanguageResult(type)) {
        // Move embedded languages items into their own box(es) before
        // processing their actual types
        spliceBoxContent(current, type.types.length, (parent) =>
          embeddedLanguageBoxFactory(parent, type.language)
        );
        // Insert new types into the current type array and re-process the
        // current token with the then-current type
        types.splice(i, 1, ...type.types);
        i--;
      } else if (isTokenReplacementResult(type)) {
        const newTokens = [];
        let x = current.x;
        let prev = current.prev;
        for (const replacement of type.replacements) {
          const token: TypedTokens = {
            x,
            y: current.y,
            prev,
            next: undefined,
            text: replacement.text,
            type: replacement.type,
            parent: current.parent,
            width: replacement.text.length,
            height: 1,
          };
          newTokens.push(token);
          x += replacement.text.length;
          prev.next = token;
          prev = token;
        }
        // Splice new tokens into the list of tokens
        newTokens[newTokens.length - 1].next = current.next;
        root.content.splice(
          root.content.indexOf(current),
          1,
          ...(newTokens as any) //
        );
        i += newTokens.length;
        current = current.next;
      } else {
        throw new Error(
          `Language definition for ${languageDefinition.name} returned ${type} for "${current.text}"`
        );
      }
    }
  }
  applyPostprocessor(first);
  return root as Box<TypedTokens, Decoration<TypedTokens>>; // ¯\_(ツ)_/¯
}
