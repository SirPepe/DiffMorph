// This module is a JS frontend for the tokenizer. Its fromData() function takes
// code in the form of strings and objects (the latter representing boxes) and
// returns optimized keyframes.

import {
  Box,
  Code,
  CodeContainer,
  Decoration,
  RenderData,
  RenderDecoration,
  RenderText,
  TextToken,
} from "../types";
import { tokenize } from "../lib/tokenizer";
import { applyLanguage } from "../lib/language";
import { toRenderData } from "../lib/render";
import { optimizeDiffs } from "../lib/optimize";
import { diff } from "../lib/diff";
import { createIdGenerator } from "../lib/util";
import { toLifecycle } from "../lib/lifecycle";
import { InputOptions, withDefaults } from "./options";

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
  source: InputContainer,
  tabSize: number
): Box<TextToken, Decoration<TextToken>> {
  return tokenize(extractCode(source), tabSize);
}

// Actual facade for processing data
export function fromData(
  inputs: InputContainer[],
  options: InputOptions
): RenderData<RenderText, RenderDecoration> {
  const inputConfig = withDefaults(options);
  const typed = inputs.map((input) => {
    const tokenized = processCode(input, inputConfig.tabSize);
    if (inputConfig.languageOverride) {
      tokenized.language = inputConfig.languageOverride;
    }
    return applyLanguage(tokenized);
  });
  const diffs = optimizeDiffs(diff(typed));
  return toRenderData(toLifecycle(diffs, true));
}
