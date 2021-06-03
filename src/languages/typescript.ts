import { LanguageDefinition } from "../types";
import { languageDefinition as ECMAScript } from "./ecmascript";

function defineJavaScript(): ReturnType<
  typeof languageDefinition["definitionFactory"]
> {
  return ECMAScript.definitionFactory({ types: true });
}

export const languageDefinition: LanguageDefinition<Record<string, any>> = {
  name: "typescript",
  theme: ECMAScript.theme,
  definitionFactory: defineJavaScript,
  postprocessor: ECMAScript.postprocessor,
};
