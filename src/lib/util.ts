import fnv1a from "@sindresorhus/fnv1a";
import { Box, Decoration } from "../types";

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
  if (typeof x === "object" && x.kind === "BOX") {
    return true;
  }
  return false;
}

export function isMetaToken(x: any): x is Decoration {
  if (typeof x === "object" && x.kind === "META") {
    return true;
  }
  return false;
}

export function getFirstTextToken<T>(
  tokens: (T | Decoration | Box<T | Decoration>)[]
): T | undefined {
  for (const token of tokens) {
    if (isMetaToken(token)) {
      continue;
    }
    if (isBox(token)) {
      const first = getFirstTextToken(token.tokens);
      if (first) {
        return first;
      } else {
        continue;
      }
    }
    return token;
  }
};

export function getLastTextToken<T>(
  tokens: (T | Decoration | Box<T | Decoration>)[]
): T | undefined {
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    if (isMetaToken(token)) {
      continue;
    }
    if (isBox(token)) {
      const first = getLastTextToken(token.tokens);
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
  parent: Box<any> | undefined;
};

function absoluteCoordinates(
  token: PositionedToken
): { x: number, y: number; } {
  if (!token.parent) {
    return {
      x: token.x,
      y: token.y
    };
  }
  const { x, y } = absoluteCoordinates(token.parent);
  return {
    x: token.x + x,
    y: token.y + y
  };
}

export function isAdjacent(
  a: (PositionedToken & { text: string }) | undefined,
  b: (PositionedToken & { text: string }) | undefined
): boolean {
  if (!a || !b) {
    return false;
  }
  const [aCoords, bCoords] = (a.parent === b.parent)
    ? [{ x: a.x, y: a.y }, { x: b.x, y: b.y }]
    : [absoluteCoordinates(a), absoluteCoordinates(b)];
  if (aCoords.y !== bCoords.y) {
    return false;
  }
  if (aCoords.x + a.text.length === bCoords.x) {
    return true;
  }
  if (bCoords.x + b.text.length === aCoords.x) {
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
