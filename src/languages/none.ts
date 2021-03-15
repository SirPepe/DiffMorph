// This "language" does not implement any typing logic. Useful for tests and
// whenever you want to morph plain text.

import { LanguageDefinition } from "../types";

export const languageDefinition: LanguageDefinition<Record<never, never>> = {
  definitionFactory: () => (): string | string[] => "token",
  gluePredicate: (): boolean => false,
};
