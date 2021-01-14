import fnv1a from "@sindresorhus/fnv1a";

export const hash = (input: string): string => fnv1a(input).toString(36);

export const last = <T extends { next: T | undefined }>(x: T): T =>
  x.next ? last(x.next) : x;
