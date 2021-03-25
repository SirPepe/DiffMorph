// This module is a JS frontend for the tokenizer. Its fromData() function takes
// code in the form of strings and objects (the latter representing boxes) and
// returns optimized keyframes.

import {
  BoxToken,
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
import { flattenTokens } from "../lib/util";

export type InputContainer = {
  content: Input[];
  id: string;
  isHighlight: boolean;
};

export type Input = string | InputContainer;

const extractCode = (source: InputContainer): CodeContainer => {
  const extracted: Code[] = [];
  for (const input of source.content) {
    if (typeof input === "string") {
      extracted.push(input);
    } else {
      extracted.push(extractCode(input));
    }
  }
  const hash = source.id;
  const meta = { id: source.id, isHighlight: source.isHighlight };
  return { content: extracted, hash, id: hash, meta };
};

// Only exported for unit tests
export const processCode = (
  source: InputContainer
): { root: BoxToken<TextToken>; highlights: HighlightToken[] } => {
  return tokenize(extractCode(source));
};

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
