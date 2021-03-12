// This "language" does not implement any typing logic. Useful for tests and
// whenever you want to morph plain text.

export const languageDefinition = () => (): string | string[] => "token";
export const gluePredicate = (): boolean => false;
