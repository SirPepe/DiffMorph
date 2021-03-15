import { LanguageDefinition } from "../types";
import { languageDefinition as ECMAScript } from "./ecmascript";

function defineJavaScript(): ReturnType<
  typeof languageDefinition["definitionFactory"]
> {
  return ECMAScript.definitionFactory({ types: false });
}

export const languageDefinition: LanguageDefinition<Record<never, never>> = {
  definitionFactory: defineJavaScript,
  gluePredicate: ECMAScript.gluePredicate,
};
