import { LanguageDefinition } from "../types";
import { languageDefinition as HTML } from "./html";

function defineJavaScript(): ReturnType<
  typeof languageDefinition["definitionFactory"]
> {
  return HTML.definitionFactory({ xml: true });
}

export const languageDefinition: LanguageDefinition<Record<string, any>> = {
  name: "xml",
  theme: HTML.theme,
  definitionFactory: defineJavaScript,
  postprocessor: HTML.postprocessor,
  patternHints: [
    ["attribute", "operator namespace-attribute", "attribute"],
    ["tag", "operator namespace-tag", "tag"],
  ],
};
