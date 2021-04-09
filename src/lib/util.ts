import fnv1a from "@sindresorhus/fnv1a";
import { Box, Decoration } from "../types";

export const hash = (input: string): string => fnv1a(input).toString(36);

export function assertIs<T>(
  x: T | undefined | null,
  msg = `Expected value to be defined, but found ${x}`
): asserts x is T {
  if (!x) {
    throw new Error(msg);
  }
}

export function assertIsNot<T>(
  x: T | undefined | null,
  msg = `Expected value to be null or undefined, but found ${typeof x}`
): asserts x is undefined | null {
  if (x) {
    throw new Error(msg);
  }
}

export function isBox<T, D>(x: any): x is Box<T, D> {
  if (typeof x === "object" && x.kind === "BOX") {
    return true;
  }
  return false;
}

export function isDecoration<T = any>(x: any): x is Decoration<T> {
  if (typeof x === "object" && x.kind === "DECO") {
    return true;
  }
  return false;
}

export function getFirstTextToken<T>(
  tokens: (T | Decoration<T> | Box<T, Decoration<T>>)[]
): T | undefined {
  for (const token of tokens) {
    if (isDecoration(token)) {
      continue;
    }
    if (isBox(token)) {
      const first = getFirstTextToken(token.content);
      if (first) {
        return first;
      } else {
        continue;
      }
    }
    return token;
  }
}

export function getLastTextToken<T>(
  tokens: (T | Decoration<T> | Box<T, Decoration<T>>)[]
): T | undefined {
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    if (isDecoration(token)) {
      continue;
    }
    if (isBox(token)) {
      const first = getLastTextToken(token.content);
      if (first) {
        return first;
      } else {
        continue;
      }
    }
    return token;
  }
}

export function flattenTokens<T extends { next: T | undefined }>(
  token: T | undefined
): T[] {
  const result: T[] = [];
  while (token) {
    result.push(token);
    token = token.next;
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

type PositionedToken = {
  x: number;
  y: number;
  width: number;
};

export function isAdjacent(
  a: PositionedToken | undefined,
  b: PositionedToken | undefined
): boolean {
  if (!a || !b) {
    return false;
  }
  const aCoords = { x: a.x, y: a.y };
  const bCoords = { x: b.x, y: b.y };
  if (aCoords.y !== bCoords.y) {
    return false;
  }
  if (aCoords.x + a.width === bCoords.x) {
    return true;
  }
  if (bCoords.x + b.width === aCoords.x) {
    return true;
  }
  return false;
}

export function isNewLine(
  token: { y: number; prev: { y: number } | undefined }
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

export function findMaxValue<T>(
  items: Iterable<T>,
  computer: (item: T) => number
): number {
  return computer(findMax(items, computer));
}

export function findMin<T>(
  items: Iterable<T>,
  computer: (item: T) => number
): T {
  return findMax(items, (item: T) => computer(item) * -1);
}

export function findMinValue<T>(
  items: Iterable<T>,
  computer: (item: T) => number
): number {
  return computer(findMin(items, computer));
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
