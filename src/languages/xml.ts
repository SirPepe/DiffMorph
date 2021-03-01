import * as html from "./html";

export const languageDefinition = (): ReturnType<
  typeof html["languageDefinition"]
> => html.languageDefinition({ xml: true });

export const gluePredicate = html.gluePredicate;
