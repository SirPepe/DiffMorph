// This module is a JS frontend for the tokenizer. Its fromData() function takes
// code in the form of strings and objects (the latter representing boxes) and
// returns optimized keyframes.

import {
  Box,
  Code,
  CodeContainer,
  Decoration,
  LanguageDefinition,
  TextToken,
} from "../types";
import { tokenize } from "../lib/tokenizer";
import { applyLanguage } from "../lib/language";
import { Keyframe, toKeyframes } from "../lib/keyframes";
import { optimize } from "../lib/optimize";
import { diff } from "../lib/diff";
import { createIdGenerator } from "../lib/util";

type Input = string | InputContainer;

type InputContainer = {
  content: Input[];
  id: string;
  isDecoration: boolean;
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
    isDecoration: source.isDecoration,
    language: source.language,
    hash: source.id,
    id: idGenerator(null, source.id),
    data: {},
  };
}

// Only exported for unit testing code extraction
export function processCode(
  source: InputContainer
): Box<TextToken, Decoration<TextToken>> {
  return tokenize(extractCode(source));
}

// Actual facade for processing data
export function fromData(
  inputs: InputContainer[],
  lang: LanguageDefinition<Record<string, any>>
): Keyframe[] {
  const typed = inputs.map((input) => applyLanguage(lang, processCode(input)));
  const ops = optimize(diff(typed));
  return toKeyframes(ops);
}
