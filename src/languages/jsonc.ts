import { LanguageDefinition } from "../types";
import { languageDefinition as JSON } from "./json";

function defineJSONC(): ReturnType<
  typeof languageDefinition["definitionFactory"]
> {
  return JSON.definitionFactory({ comments: true });
}

export const languageDefinition: LanguageDefinition<Record<never, never>> = {
  definitionFactory: defineJSONC,
  gluePredicate: JSON.gluePredicate,
};
