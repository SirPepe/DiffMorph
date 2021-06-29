import { isBox } from "./box";
import { Box, Decoration, Token } from "../types";

const CHARSET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function toString(number: number): string {
  let res = "";
  while (number > 0) {
    res = CHARSET[number % CHARSET.length] + res;
    number = Math.floor(number / CHARSET.length);
  }
  return res;
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
  numbers = [...numbers]; // lest the iterable be consumed by Math.min
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
