import { LanguageDefinition } from "../types";
import { languageDefinition as JSON } from "./json";

function defineJSONC(): ReturnType<
  typeof languageDefinition["definitionFactory"]
> {
  return JSON.definitionFactory({ comments: true });
}

export const languageDefinition: LanguageDefinition<Record<string, any>> = {
  definitionFactory: defineJSONC,
  postprocessor: JSON.postprocessor,
};
