import fnv1a from "@sindresorhus/fnv1a";
import { Box, HighlightToken, TextToken, TokenLike } from "../types";

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

export const isTextToken = (
  x: TextToken | Box<TextToken> | HighlightToken
): x is TextToken => "text" in x && typeof x.text === "string";

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

export const unwrapFirst = (token: TextToken | Box<TextToken>): TextToken => {
  if (isTextToken(token)) {
    return token;
  } else {
    return unwrapFirst(token.tokens[0]);
  }
};

export const unwrapLast = (token: TextToken | Box<TextToken>): TextToken => {
  if (isTextToken(token)) {
    return token;
  } else {
    return unwrapFirst(token.tokens[token.tokens.length - 1]);
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

type GroupFunction = {
  <T, Key extends keyof T>(values: Iterable<T>, select: Key): Map<T[Key], T[]>;
  <T, Key>(values: Iterable<T>, select: (arg: T) => Key): Map<Key, T[]>;
};

export const groupBy: GroupFunction = (values: Iterable<any>, select: any) => {
  const result = new Map();
  if (typeof select === "function") {
    for (const value of values) {
      const key = select(value);
      result.set(key, [...(result.get(key) || []), value]);
    }
  } else {
    for (const value of values) {
      const key = value[select];
      result.set(key, [...(result.get(key) || []), value]);
    }
  }
  return result;
};

export function partition<T>(
  input: Iterable<T>,
  selector: (x: T) => boolean
): [T[], T[]];
export function partition<T, U>(
  input: Iterable<T | U>,
  selector: (x: T | U) => x is T
): [T[], U[]];
export function partition<T>(
  input: Iterable<T>,
  selector: (item: T) => boolean
): [T[], T[]] {
  const a = [];
  const b = [];
  for (const item of input) {
    if (selector(item)) {
      a.push(item);
    } else {
      b.push(item);
    }
  }
  return [a, b];
}

export function mapToObject<Value>(
  input: Map<string, Value>
): Record<string, Value> {
  return Object.fromEntries(input.entries());
}

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
