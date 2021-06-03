import { LanguageDefinition } from "../types";
import { languageDefinition as JSON } from "./json";

function defineJSONC(): ReturnType<
  typeof languageDefinition["definitionFactory"]
> {
  return JSON.definitionFactory({ comments: true });
}

export const languageDefinition: LanguageDefinition<Record<string, any>> = {
  name: "jsonc",
  theme: JSON.theme,
  definitionFactory: defineJSONC,
  postprocessor: JSON.postprocessor,
  patternHints: [],
};
