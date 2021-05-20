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

type InputDecoration = {
  x: number;
  y: number;
  width: number;
  height: number;
  data: Record<string, any>; // tag name and attributes for DOM sources
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

function processExternalDecorations(
  input: InputDecoration[],
  parent: Box<TextToken, any>
): Decoration<TextToken>[] {
  return input.map(({ x, y, width, height, data }): Decoration<TextToken> => {
    return {
      kind: "DECO",
      parent,
      data,
      x,
      y,
      hash: data.hash || "",
      width,
      height,
    };
  });
}

// Only exported for unit testing code extraction
export function processCode(
  source: InputContainer,
  externalDecorations: InputDecoration[],
  tabSize: number
): Box<TextToken, Decoration<TextToken>> {
  const result = tokenize(extractCode(source), tabSize);
  result.decorations.push(
    ...processExternalDecorations(externalDecorations, result)
  );
  return result;
}

// Actual facade for processing data
export function fromData(
  inputs: InputContainer[],
  externalDecorations: InputDecoration[],
  options: InputOptions = {}
): RenderData<RenderText, RenderDecoration> {
  const inputConfig = withDefaults(options);
  const typed = inputs.map((input) => {
    const tokenized = processCode(
      input,
      externalDecorations,
      inputConfig.tabSize
    );
    if (inputConfig.languageOverride) {
      tokenized.language = inputConfig.languageOverride;
    }
    return applyLanguage(tokenized);
  });
  const diffs = optimizeDiffs(diff(typed));
  return toRenderData(toLifecycle(diffs, true));
}
