// This module is a JS frontend for the tokenizer. Its fromData() function takes
// code in the form of strings and objects (the latter representing boxes) and
// returns optimized keyframes.

import { BoxToken, Code, HighlightToken, LanguageDefinition } from "../types";
import { tokenize } from "../lib/tokenizer";
import { applyLanguage } from "../lib/language";
import { Keyframe, toKeyframes } from "../lib/keyframes";
import { optimize } from "../lib/optimize";
import { diffAll } from "../lib/diff";

export type InputContainer = {
  content: Input[];
  id: string;
  isHighlight: boolean;
};

export type Input = string | InputContainer;

const extractCode = (source: InputContainer): Code[] => {
  const extracted: Code[] = [];
  for (const input of source.content) {
    if (typeof input === "string") {
      extracted.push(input);
    } else {
      const content = extractCode(input);
      const hash = input.id;
      const meta = { id: input.id, isHighlight: input.isHighlight };
      extracted.push({ content, hash, meta });
    }
  }
  return extracted;
};

// Only exported for unit tests
export const processCode = (
  source: InputContainer
): [BoxToken, HighlightToken[]] => {
  const hash = source.id;
  const meta = { id: source.id, isHighlight: source.isHighlight };
  const { tokens, highlights } = tokenize(extractCode(source));
  return [{ x: 0, y: 0, hash, meta, tokens }, highlights];
};

export function fromData(
  inputContainers: InputContainer[],
  language: LanguageDefinition<Record<never, never>>
): Keyframe[] {
  const tokens = [];
  const highlights = [];
  for (const inputContainer of inputContainers) {
    const [rootBox, highlightTokens] = processCode(inputContainer);
    tokens.push(applyLanguage(language, [rootBox]));
    highlights.push(highlightTokens);
  }
  return toKeyframes(optimize(diffAll(tokens)), highlights);
}
