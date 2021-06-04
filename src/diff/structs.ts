// Find larger structures to recycle in arrays of diff tokens.

import { consume, findMaxValue } from "../util";
import { DiffTokens, Token } from "../types";
import { offsetHashChain } from "./hash";

export type Struct = Token & {
  readonly type: string;
  readonly hash: number;
  readonly items: DiffTokens[];
};

function toStructure(items: DiffTokens[], type: string): Struct {
  const { x, y } = items[0];
  return {
    x,
    y,
    width: findMaxValue(items, (item) => item.x + item.width) - x,
    height: findMaxValue(items, (item) => item.y + item.height) - y,
    type,
    hash: offsetHashChain(items),
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
