import * as ecmascript from "./ecmascript";

export const languageDefinition = (): ReturnType<
  typeof ecmascript["languageDefinition"]
> => ecmascript.languageDefinition({ types: true });

export const gluePredicate = ecmascript.gluePredicate;
