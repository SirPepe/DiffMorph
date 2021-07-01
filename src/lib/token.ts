import { Box, Decoration, Token } from "../types";
import { findMinValue } from "./util";

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

function sizeof({ content }: Box<unknown, unknown>): number {
  let size = 0;
  for (const item of content) {
    if (isBox(item)) {
      size += sizeof(item);
    } else {
      size++;
    }
  }
  return size;
}

// Modifies a source boxes content in-place by wrapping a number of tokens
// into sub-boxes. As there may be several box borders between the first and
// last item, the items are organized into batches (one per unbroken line of
// tokens belonging to the same parent) and then each parent's content gets
// modified accordingly.
export function wrapContent<
  T extends Token & { parent: Box<T, any>; next: T | undefined },
  D
>(
  firstItem: T,
  numTokens: number,
  boxFactory: (parent: Box<T, D>) => Box<T, D>
): void {
  if (numTokens === 0) {
    return;
  }
  const root = firstItem.parent;
  const items = [];
  let i = root.content.indexOf(firstItem);
  while (numTokens > 0) {
    const item = root.content[i];
    if (isBox(item)) {
      const size = sizeof(item);
      if (size <= numTokens) {
        items.push(item);
        numTokens -= size;
        i++;
      } else {
        throw new Error(
          "Should split a box in the middle, but that's not implemented"
        );
      }
    } else {
      items.push(item);
      numTokens--;
      i++;
    }
  }
  const newBox = boxFactory(root);
  const firstIdx = root.content.indexOf(items[0]);
  newBox.content = root.content.splice(firstIdx, items.length, newBox);
  newBox.x = findMinValue(newBox.content, ({ x }) => x);
  newBox.y = findMinValue(newBox.content, ({ y }) => y);
  newBox.parent = root;
  let width = 0;
  let height = 0;
  for (const item of newBox.content) {
    item.parent = newBox;
    const maxX = item.x + item.width - newBox.x;
    const maxY = item.y + item.height - newBox.y;
    if (maxX > width) {
      width = maxX;
    }
    if (maxY > height) {
      height = maxY;
    }
  }
  newBox.width = width;
  newBox.height = height;
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
