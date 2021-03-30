import fnv1a from "@sindresorhus/fnv1a";
import { Box, TokenLike } from "../types";

export const hash = (input: string): string => fnv1a(input).toString(36);

export const first = <T extends { prev: T | undefined }>(x: T): T =>
  x.prev ? first(x.prev) : x;

export const prev = <T extends { prev: T | undefined }>(
  x: T,
  steps: number
): T | undefined => {
  while (steps > 0) {
    if (x.prev) {
      x = x.prev;
      steps--;
    } else {
      return undefined;
    }
  }
  return x.prev;
};

export const last = <T extends { next: T | undefined }>(x: T): T =>
  x.next ? last(x.next) : x;

export function fail(reason?: string): never {
  throw new Error(reason);
}

export function isBox<T>(x: any): x is Box<T> {
  if (
    typeof x === "object" &&
    typeof x.id === "string" &&
    typeof x.hash === "string" &&
    typeof x.meta === "object" &&
    Array.isArray(x.tokens)
  ) {
    return true;
  }
  return false;
}

export const unwrapFirst = <T>(token: T | Box<T>): T => {
  if (isBox(token)) {
    return unwrapFirst(token.tokens[0]);
  } else {
    return token;
  }
};

export const unwrapLast = <T>(token: T | Box<T>): T => {
  if (isBox(token)) {
    return unwrapFirst(token.tokens[token.tokens.length - 1]);
  } else {
    return token;
  }
};

export function flattenTokens<T extends TokenLike>(token: T | undefined): T[] {
  const result: T[] = [];
  while (token) {
    result.push(token);
    token = token.next as any;
  }
  return result;
}

export const createIdGenerator = (): ((realm: any, hash: any) => string) => {
  const counters = new Map();
  return (realm: any, hash: any): string => {
    let counter = counters.get(realm);
    if (!counter) {
      counter = new Map();
      counters.set(realm, counter);
    }
    const num = counter.has(hash) ? counter.get(hash) + 1 : 0;
    const id = `${hash}${num}`;
    counter.set(hash, num);
    return id;
  };
};

export function isSameLine<T extends { y: number }>(a: T, b: T): boolean {
  if (a.y === b.y) {
    return true;
  }
  return false;
}

export function isAdjacent<T extends { x: number; y: number; text: string }>(
  a: T | undefined,
  b: T | undefined
): boolean {
  if (!a || !b) {
    return false;
  }
  if (!isSameLine(a, b)) {
    return false;
  }
  if (a.x + a.text.length === b.x) {
    return true;
  }
  if (b.x + b.text.length === a.x) {
    return true;
  }
  return false;
}

export function isNewLine<T extends { y: number; prev: T | undefined }>(
  token: T
): boolean {
  return Boolean(token.prev && token.y > token.prev.y);
}

export function findMax<T>(
  items: Iterable<T>,
  computer: (item: T) => number
): T {
  let max: number | undefined = undefined;
  let pick: T | undefined = undefined;
  for (const item of items) {
    const value = computer(item);
    if (typeof max === "undefined" || value > max) {
      max = value;
      pick = item;
    }
  }
  if (typeof max === "undefined") {
    throw new Error("Can't search empty list");
  }
  return pick as T; // can't not be T when max is not undefined
}

export function findMin<T>(
  items: Iterable<T>,
  computer: (item: T) => number
): T {
  return findMax(items, (item: T) => computer(item) * -1);
}

export const lookaheadText = <T extends { text: string; next: T | undefined }>(
  token: T,
  expected: string[]
): boolean => {
  while (expected.length) {
    const nextText = expected.shift();
    if (!token.next || token.next.text !== nextText) {
      return false;
    } else {
      token = token.next;
    }
  }
  return true;
};
