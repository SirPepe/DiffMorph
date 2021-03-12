import * as ecmascript from "./ecmascript";

export const languageDefinition = (): ReturnType<
  typeof ecmascript["languageDefinition"]
> => ecmascript.languageDefinition({ types: false });

export const gluePredicate = ecmascript.gluePredicate;
