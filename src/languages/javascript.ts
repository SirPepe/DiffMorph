import { LanguageDefinition } from "../types";
import { languageDefinition as ECMAScript } from "./ecmascript";

function defineJavaScript(): ReturnType<
  typeof languageDefinition["definitionFactory"]
> {
  return ECMAScript.definitionFactory({ types: false });
}

export const languageDefinition: LanguageDefinition<Record<string, any>> = {
  name: "javascript",
  definitionFactory: defineJavaScript,
  postprocessor: ECMAScript.postprocessor,
};
