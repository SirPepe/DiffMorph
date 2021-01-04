import fnv1a from "@sindresorhus/fnv1a";

export const hash = (input: string): string => fnv1a(input).toString(16);
