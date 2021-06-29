import { Box, Token } from "../types";
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
