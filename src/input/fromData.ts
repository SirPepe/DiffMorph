// This module is a JS frontend for the tokenizer. Its fromData() function takes
// code in the form of strings and objects (the latter representing boxes) and
// returns optimized keyframes.

import {
  Box,
  Code,
  CodeContainer,
  Highlight,
  LanguageDefinition,
  TextToken,
  TypedToken,
} from "../types";
import { tokenize } from "../lib/tokenizer";
import { applyLanguage } from "../lib/language";
import { Keyframe, toKeyframes } from "../lib/keyframes";
import { optimize } from "../lib/optimize";
import { diff } from "../lib/diff";
import { createIdGenerator, flattenTokens, unwrapFirst } from "../lib/util";

type Input = string | InputContainer;

type InputContainer = {
  content: Input[];
  id: string;
  isHighlight: boolean;
  language: string | undefined;
};

function extractCode(source: InputContainer): CodeContainer {
  const idGenerator = createIdGenerator();
  const content: Code[] = [];
  for (const input of source.content) {
    if (typeof input === "string") {
      content.push(input);
    } else {
      content.push(extractCode(input));
    }
  }
  return {
    content,
    isHighlight: source.isHighlight,
    language: source.language,
    hash: source.id,
    id: idGenerator(null, source.id),
    meta: {},
  };
}

// Only exported for unit testing code extraction
export function processCode(
  source: InputContainer,
): Box<TextToken | Highlight> {
  return tokenize(extractCode(source));
}

// Actual facade for processing data
export function fromData(
  inputContainers: InputContainer[],
  language: LanguageDefinition<Record<string, any>>
): Keyframe[] {
  const heads: TypedToken[] = [];
  for (const inputContainer of inputContainers) {
    const root = processCode(inputContainer);
    heads.push(unwrapFirst(applyLanguage(language, root)));
  }
  const tokens = heads.map(flattenTokens);
  return toKeyframes(optimize(diff(tokens)));
}
