import { applyLanguage } from "../src/language";
import { tokenize } from "../src/input/tokenizer";
import { Code, RawToken, TypedToken } from "../src/types";

export const type = (lang: {
  languageDefinition: () => (token: RawToken) => string | string[];
  gluePredicate: (token: TypedToken) => boolean;
}) => (...input: Code[]): TypedToken[] =>
  applyLanguage(
    lang.languageDefinition,
    lang.gluePredicate,
    tokenize(input).tokens
  );
