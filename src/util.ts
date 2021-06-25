import { Box, Decoration, Token } from "./types";

const CHARSET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function toString(number: number): string {
  let res = "";
  while (number > 0) {
    res = CHARSET[number % 62] + res;
    number = Math.floor(number / 62);
  }
  return res;
}

export function is<T>(x: T | undefined | null): x is T {
  if (typeof x === "undefined" || x === null) {
    return false;
  }
  return true;
}

export function isNot<T>(x: T | undefined | null): x is null | undefined {
  return !is(x);
}

export function assertIs<T>(
  x: T | undefined | null,
  name = "value"
): asserts x is T {
  if (!is(x)) {
    throw new Error(`Expected ${name} to be defined, but found ${x}`);
  }
}

export function assertIsNot<T>(
  x: T | undefined | null,
  name = "value"
): asserts x is undefined | null {
  if (is(x)) {
    throw new Error(
      `Expected ${name} to be null or undefined, but found ${typeof x}
    `
    );
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
  if (numItems === 0) {
    return;
  }
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
    newBox.content.forEach((item) => (item.parent = newBox));
  }
}

export function getLanguage(element: Element): string | undefined {
  const { 1: match } = /(?:.*)language-(\S+)/.exec(element.className) ?? [];
  return match;
}

export function isBox<T extends Box<any, any>>(x: T | any): x is T {
  if (
    x !== null &&
    typeof x === "object" &&
    Array.isArray(x.content) &&
    Array.isArray(x.decorations)
  ) {
    return true;
  }
  return false;
}

export function getFirstTextToken<T>(
  tokens: (T | Box<T, Decoration<T>>)[]
): T | undefined {
  for (const token of tokens) {
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
  tokens: (T | Box<T, Decoration<T>>)[]
): T | undefined {
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
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

export const createIdGenerator = (): ((realm: any, hash: string) => string) => {
  const counters = new Map();
  return (realm: any, hash: string): string => {
    let counter = counters.get(realm);
    if (!counter) {
      counter = new Map();
      counters.set(realm, counter);
    }
    const num = counter.has(hash) ? counter.get(hash) + 1 : 0;
    counter.set(hash, num);
    if (num === 0) {
      return String(hash);
    }
    return `${hash}${num}`;
  };
};

export function advance<T extends { next: T | undefined }>(
  item: T,
  steps: number
): T | undefined {
  let current: T | undefined = item;
  let stepsTaken = 0;
  while (steps > stepsTaken) {
    current = current?.next;
    if (!current) {
      return undefined;
    }
    stepsTaken++;
  }
  return current;
}

export function seekForwards<T extends { next: T | undefined }>(
  item: T,
  condition: (item: T) => boolean
): T | undefined {
  let current: T | undefined = item;
  while (current && condition(current) === false) {
    current = current?.next;
    if (!current) {
      return undefined;
    }
  }
  return current;
}

export function seekBackwards<T extends { prev: T | undefined }>(
  item: T,
  condition: (item: T) => boolean
): T | undefined {
  let current: T | undefined = item;
  while (current && condition(current) === false) {
    current = current?.prev;
    if (!current) {
      return undefined;
    }
  }
  return current;
}

// Take items from "items", starting at index "from" until "done" returns either
// true or null (the latter signalling an abort)
export function consume<T extends { next: T | undefined }>(
  items: T[],
  from: number,
  done: (item: T) => boolean | null // null = abort
): { result: T[]; position: number } {
  const consumed = [];
  for (let i = from; i < items.length; i++) {
    const result = done(items[i]);
    if (result === null) {
      return { result: [], position: i };
    } else {
      consumed.push(items[i]);
      if (result === true) {
        return { result: consumed, position: i };
      }
    }
  }
  return { result: [], position: items.length };
}

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

export function dimensionsEql(a: Token, b: Token): boolean {
  if (
    a.x !== b.x ||
    a.y !== b.y ||
    a.width !== b.width ||
    a.height !== b.height
  ) {
    return false;
  }
  return true;
}

export function minmax(numbers: Iterable<number>): [number, number] {
  numbers = [...numbers]; // lest the iterable be consumed
  return [Math.min(...numbers), Math.max(...numbers)];
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

export const lookbehindType = <
  T extends { type?: string; prev: T | undefined }
>(
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
