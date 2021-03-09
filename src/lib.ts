import fnv1a from "@sindresorhus/fnv1a";

export const hash = (input: string): string => fnv1a(input).toString(36);

export const prev = <T extends { prev: T | undefined }>(x: T): T =>
  x.prev ? prev(x.prev) : x;

export const last = <T extends { next: T | undefined }>(x: T): T =>
  x.next ? last(x.next) : x;

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

/* eslint-disable */
type Tuple<
  T,
  Length extends number,
  Rest extends unknown[] = []
> = Length extends Length
  ? number extends Length
    ? T[]
    : Rest["length"] extends Length
      ? Rest
      : Tuple<T, Length, [T, ...Rest]>
  : never;
/* eslint-enable */

export const lookaheadText = <
  T extends { text: string; next: T | undefined },
  N extends number
>(
  token: T,
  steps: N,
  expected: Tuple<string, N>
): boolean => {
  let step = 0;
  while (step < steps) {
    if (!token.next || token.next.text !== expected[step]) {
      return false;
    } else {
      step++;
      token = token.next;
    }
  }
  return true;
};
