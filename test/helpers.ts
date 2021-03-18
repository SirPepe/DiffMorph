import { applyLanguage } from "../src/lib/language";
import { tokenize } from "../src/lib/tokenizer";
import { Code, LanguageDefinition, TypedToken } from "../src/types";

export const type = (lang: LanguageDefinition<any>) => (
  ...input: Code[]
): TypedToken[] => {
  return applyLanguage(lang, {
    x: 0,
    y: 0,
    meta: {},
    hash: "",
    tokens: tokenize(input).tokens,
  });
};
