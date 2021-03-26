// This module is a JS frontend for the tokenizer. Its fromData() function takes
// code in the form of strings and objects (the latter representing boxes) and
// returns optimized keyframes.

import {
  Box,
  Code,
  CodeContainer,
  HighlightToken,
  LanguageDefinition,
  TextToken,
} from "../types";
import { tokenize } from "../lib/tokenizer";
import { applyLanguage } from "../lib/language";
import { Keyframe, toKeyframes } from "../lib/keyframes";
import { optimize } from "../lib/optimize";
import { diffAll } from "../lib/diff";
import { createIdGenerator, flattenTokens } from "../lib/util";

export type InputContainer = {
  content: Input[];
  id: string;
  isHighlight: boolean;
};

export type Input = string | InputContainer;

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
  const hash = source.id;
  const isHighlight = source.isHighlight;
  const id = idGenerator(null, hash);
  return { content, isHighlight, hash, id, meta: {} };
}

// Only exported for unit tests
export function processCode(
  source: InputContainer
): { root: Box<TextToken>; highlights: HighlightToken[] } {
  return tokenize(extractCode(source));
}

export function fromData(
  inputContainers: InputContainer[],
  language: LanguageDefinition<Record<string, any>>
): Keyframe[] {
  const heads = [];
  const highlights = [];
  for (const inputContainer of inputContainers) {
    const processed = processCode(inputContainer);
    heads.push(applyLanguage(language, processed.root));
    highlights.push(processed.highlights);
  }
  const tokens = heads.map(flattenTokens);
  return toKeyframes(optimize(diffAll(tokens)), highlights);
}
