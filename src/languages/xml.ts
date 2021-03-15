import { LanguageDefinition } from "../types";
import { languageDefinition as HTML } from "./html";

function defineJavaScript(): ReturnType<
  typeof languageDefinition["definitionFactory"]
> {
  return HTML.definitionFactory({ xml: true });
}

export const languageDefinition: LanguageDefinition<Record<never, never>> = {
  definitionFactory: defineJavaScript,
  gluePredicate: HTML.gluePredicate,
};
