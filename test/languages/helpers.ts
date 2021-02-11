import { applyLanguage } from "../../src/language";
import { tokenize } from "../../src/tokenizer";
import {
  Code,
  LanguageToken,
  TypedLanguageToken,
  TypedToken,
} from "../../src/types";

export const type = (lang: {
  languageDefinition: () => (token: LanguageToken) => string | string[];
  gluePredicate: (token: TypedLanguageToken) => boolean;
}) => (...input: Code[]): TypedToken[] =>
  applyLanguage(
    lang.languageDefinition,
    lang.gluePredicate,
    tokenize(input).tokens
  );
