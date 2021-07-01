import { Token } from "../types";

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

export function positionsEql(a: Token, b: Token): boolean {
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
