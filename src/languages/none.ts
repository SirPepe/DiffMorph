// This "language" does not implement any typing logic. Useful for tests and
// whenever you want to morph plain text.

import { LanguageDefinition, LanguageFunctionResult } from "../types";

export const languageDefinition: LanguageDefinition<Record<string, any>> = {
  definitionFactory: () => (): LanguageFunctionResult => "token",
  postprocessor: (): boolean => false,
};
