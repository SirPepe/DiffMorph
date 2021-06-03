// Find larger structures in arrays of diff tokens

import { consume, findMaxValue, hash } from "../lib/util";
import { DiffTokens, Token } from "../types";

export type Struct = Token & {
  readonly type: string;
  readonly hash: number;
  readonly items: DiffTokens[];
};

// Create a hash of a list of tokens by concatenating the token's hashes and
// their *relative* offsets. The absolute coordinates are not reflected in the
// hash - two structs containing the same characters the same distances apart on
// either axis get the same hash, no matter the absolute offsets.
function hashItems(items: DiffTokens[]): number {
  const hashes = items.flatMap((item, idx) => {
    const xDelta = idx > 0 ? item.x - items[idx - 1].x : 0;
    const yDelta = idx > 0 ? item.y - items[idx - 1].y : 0;
    return [item.hash, xDelta, yDelta];
  });
  return hash(hashes);
}

function toStructure(items: DiffTokens[], type: string): Struct {
  const { x, y } = items[0];
  return {
    x,
    y,
    width: findMaxValue(items, (item) => item.x + item.width) - x,
    height: findMaxValue(items, (item) => item.y + item.height) - y,
    type,
    hash: hashItems(items),
    items,
  };
}

function matchPatterns(item: DiffTokens): DiffTokens[] {
  // Create a pattern for operators and their LHS and RHS
  if (item.next && /operator[ -]/.test(item.next.type) && item.next.next) {
    return [item, item.next, item.next.next];
  }
  return [];
}

type EndMatcher = {
  type: string;
  match: (item: DiffTokens) => boolean;
};

function matchStructStart(item: DiffTokens): EndMatcher | null {
  const typeMatch = /(.*)-start-(\d)+$/.exec(item.type);
  if (typeMatch && typeMatch.length === 3) {
    const [, type, level] = typeMatch;
    return {
      type,
      match: (end: DiffTokens) =>
        new RegExp(`${type}-end-${level}`).test(end.type),
    };
  }
  if (item.type.startsWith("string")) {
    const quotesMatch = /^(?<!\\)(["'`])+/.exec(item.text);
    if (quotesMatch && quotesMatch.length === 2) {
      const [, quotes] = quotesMatch;
      return {
        type: "string",
        match: (end: DiffTokens) =>
          end.type.startsWith("string") &&
          !end.prev?.text.endsWith("\\") &&
          new RegExp(`(?<!\\\\)[${quotes}]$`).test(end.text),
      };
    }
  }
  return null;
}

export function findStructs(items: DiffTokens[]): {
  rest: DiffTokens[];
  structs: Struct[];
} {
  const rest: DiffTokens[] = [];
  const structs: Struct[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const pattern = matchPatterns(item);
    if (pattern.length > 0) {
      structs.push(toStructure(pattern, "pattern"));
      i += pattern.length - 1;
      continue;
    }
    const endMatcher = matchStructStart(item);
    if (endMatcher) {
      const { result, position } = consume(items, i, (next) => {
        if (next.parent !== item.parent) {
          return null;
        }
        if (next !== item && endMatcher.match(next)) {
          return true;
        }
        return false;
      });
      if (result.length > 0) {
        structs.push(toStructure(result, endMatcher.type));
        i = position;
        continue;
      }
    }
    rest.push(item);
  }
  return { rest, structs };
}
