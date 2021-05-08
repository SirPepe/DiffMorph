import { Box, Decoration } from "../types";

export function hash(input: string): string {
  let hash = 2166136261;
  let nonAscii = false;
  for (let i = 0; i < input.length; i++) {
    let characterCode = input.charCodeAt(i);
    if (characterCode > 0x7F && !nonAscii) {
      input = unescape(encodeURIComponent(input));
      characterCode = input.charCodeAt(i);
      nonAscii = true;
    }
    hash ^= characterCode;
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

export function assertIs<T>(
  x: T | undefined | null,
  name = "value"
): asserts x is T {
  if (!x) {
    throw new Error(`Expected ${name} to be defined, but found ${x}`);
  }
}

export function assertIsNot<T>(
  x: T | undefined | null,
  name = "value"
): asserts x is undefined | null {
  if (x) {
    throw new Error(
      `Expected ${name} to be null or undefined, but found ${typeof x}
    `);
  }
}

// Modifies a source box in-place by re-organizing a number of tokens into
// sub-boxes. As there may be several box borders between the first and last
// item, the items are organized into batches (one per parent) and then each
// parent's content gets modified accordingly.
export function spliceBoxContent<
  T extends { parent: any; next: T | undefined },
  D
>(
  firstItem: T,
  numItems: number,
  boxFactory: (parent: Box<T, D>) => Box<T, D>
): void {
  const batches = [];
  let lastParent = firstItem.parent;
  let currentItem = firstItem;
  let currentBatch = [];
  while (numItems > 0) {
    if (currentItem.parent != lastParent) {
      batches.push(currentBatch);
      currentBatch = [];
      lastParent = currentItem.parent;
    }
    currentBatch.push(currentItem);
    if (currentItem.next) {
      currentItem = currentItem.next;
    }
    numItems--;
  }
  batches.push(currentBatch);
  for (const batch of batches) {
    const parent = batch[0].parent;
    const firstIdx = parent.content.indexOf(batch[0]);
    const newBox = boxFactory(parent);
    newBox.content = parent.content.splice(firstIdx, batch.length, newBox);
  }
}

export function getLanguage(element: Element): string | undefined {
  const { 1: match } = /(?:.*)language-(\S+)/.exec(element.className) ?? [];
  return match;
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

export function isNewLine(token: {
  y: number;
  prev: { y: number } | undefined;
}): boolean {
  return Boolean(token.prev && token.y > token.prev.y);
}

export function minmax(numbers: Iterable<number>): [number, number] {
  numbers = [...numbers]; // lest the iterable be consumed
  return [Math.min(...numbers), Math.max(...numbers)]
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

export const lookbehindText = <T extends { text: string; prev: T | undefined }>(
  token: T,
  expected: string[]
): boolean => {
  while (expected.length) {
    const nextText = expected.pop();
    if (!token.prev || token.prev.text !== nextText) {
      return false;
    } else {
      token = token.prev;
    }
  }
  return true;
};

export const lookbehindType = <T extends { type?: string; prev: T | undefined }>(
  token: T,
  expected: string[]
): boolean => {
  while (expected.length) {
    const value = expected.pop();
    if (!token.prev || token.prev.type !== value) {
      return false;
    } else {
      token = token.prev;
    }
  }
  return true;
};
