import * as json from "./json";

export const languageDefinition = (): ReturnType<
  typeof json["languageDefinition"]
> => json.languageDefinition({ comments: true });

export const gluePredicate = json.gluePredicate;
