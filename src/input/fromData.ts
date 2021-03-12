// This module is a JS frontend for the tokenizer. It takes code from strings
// and objects (representing boxes) and returns tokens.

import { BoxToken, Code, HighlightToken } from "../types";
import { tokenize } from "../lib/tokenizer";

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

export const processCode = (
  source: InputContainer
): [BoxToken, HighlightToken[]] => {
  const hash = source.id;
  const meta = { id: source.id, isHighlight: source.isHighlight };
  const { tokens, highlights } = tokenize(extractCode(source));
  return [{ x: 0, y: 0, hash, meta, tokens }, highlights];
};
