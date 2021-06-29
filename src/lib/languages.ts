export class Stack<T extends string | undefined> {
  private data: T[] = [];
  constructor(private defaultValue: T) {}

  push(value: T): { before: number; after: number } {
    const before = this.data.filter((str) => str === value).length;
    this.data.push(value);
    return { before, after: before + 1 };
  }

  pop(): { before: number; after: number; value: T } {
    const value = this.data[this.data.length - 1];
    if (!value) {
      return { before: 0, after: 0, value: this.defaultValue };
    }
    const before = this.data.filter((str) => str === value).length;
    this.data.length = this.data.length - 1;
    return { before, after: before - 1, value };
  }

  peek(): { current: number; value: T } {
    const value = this.data[this.data.length - 1];
    if (!value) {
      return { current: 0, value: this.defaultValue };
    }
    const current = this.data.filter((str) => str === value).length;
    return { current, value };
  }

  swap(replacement: T): { current: number; value: T } {
    const index = this.data.length - 1;
    if (!this.data[index]) {
      throw new Error("Can't swap on empty stack");
    }
    this.data[index] = replacement;
    return { current: index, value: replacement };
  }

  size(): number {
    return this.data.length;
  }
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

export function isNewLine<T extends { y: number; prev: T | undefined }>(
  token: T
): boolean {
  if (!token.prev) {
    return true;
  }
  return Boolean(token.y > token.prev.y);
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
