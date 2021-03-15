import { applyLanguage } from "../src/lib/language";
import { tokenize } from "../src/lib/tokenizer";
import { Code, LanguageDefinition, TypedToken } from "../src/types";

export const type = (lang: LanguageDefinition<any>) => (
  ...input: Code[]
): TypedToken[] => applyLanguage(lang, tokenize(input).tokens);
