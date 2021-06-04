// Find and work with larger structures to recycle in arrays of diff tokens.

import { consume, findMaxValue } from "../util";
import { DiffOp, DiffTokens, MOV, Token } from "../types";
import { offsetHashChain } from "./hash";
import { groupBy } from "@sirpepe/shed";
import { diffArrays } from "diff";
import { pickAlternative } from "./heuristics";

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

// Organize tokens into lines, which are just a special case of structure
function asLines(tokens: DiffTokens[]): Struct[] {
  const byLine = groupBy(tokens, "y");
  return Array.from(byLine, ([y, items]) => {
    const hash = offsetHashChain(items);
    const x = items.length > 0 ? items[0].x : 0;
    const width = items[items.length - 1].x + items[items.length - 1].width - x;
    return {
      type: "line",
      hash,
      items,
      x,
      y,
      width,
      height: 1,
      structures: [],
    };
  });
}

// If a structure was moved on some axis, create MOV ops for the affected tokens
function shift<T extends Token & { items: DiffTokens[] }>(
  from: T,
  to: T
): MOV<DiffTokens>[] {
  const ops: MOV<DiffTokens>[] = [];
  if (from.x !== to.x || from.y !== to.y) {
    for (let i = 0; i < from.items.length; i++) {
      ops.push({
        kind: "MOV",
        item: to.items[i],
        from: from.items[i],
      });
    }
  }
  return ops;
}

// Find and keep unique language structures
function diffStructures(
  from: Struct[],
  to: Struct[]
): { result: MOV<DiffTokens>[]; restFrom: DiffTokens[]; restTo: DiffTokens[] } {
  const result: MOV<DiffTokens>[] = [];
  const fromByHash = groupBy(from, "hash");
  const changes = diffArrays(from, to, {
    comparator: (a, b) => a.hash === b.hash,
    ignoreCase: false,
  });
  for (const change of changes) {
    if (change.removed) {
      continue;
    }
    // Check if the structure in question has just been moved. This includes
    // changes that are marked as nether "added" nor "removed" because the hash
    // that the diff operates on ignores absolute coordinates
    for (const structure of change.value) {
      const alternatives = fromByHash.get(structure.hash);
      if (!alternatives) {
        continue;
      }
      const [previous, index] = pickAlternative(structure, alternatives);
      if (previous) {
        result.push(...shift(previous, structure));
        alternatives.splice(index, 1);
      }
    }
  }
  const done = new Set(result.flatMap(({ item, from }) => [item, from]));
  const restFrom = from.flatMap(({ items }) =>
    items.filter((item) => !done.has(item))
  );
  const restTo = to.flatMap(({ items }) =>
    items.filter((item) => !done.has(item))
  );
  return { result, restFrom, restTo };
}

type StructDiff = {
  result: DiffOp<DiffTokens>[];
  restFrom: DiffTokens[];
  restTo: DiffTokens[];
};

export function diffLinesAndStructures(
  fromTokens: DiffTokens[],
  toTokens: DiffTokens[]
): StructDiff {
  const result: DiffOp<DiffTokens>[] = [];
  // First pass: find and keep unique language structures
  const { structs: fromStructs, rest: fromRest } = findStructs(fromTokens);
  const { structs: toStructs, rest: toRest } = findStructs(toTokens);
  const structureDiff = diffStructures(fromStructs, toStructs);
  fromRest.push(...structureDiff.restFrom);
  toRest.push(...structureDiff.restTo);
  result.push(...structureDiff.result);
  // Second pass: diff lines of remaining tokens
  const lineDiff = diffStructures(asLines(fromRest), asLines(toRest));
  result.push(...lineDiff.result);
  return { result, restFrom: lineDiff.restFrom, restTo: lineDiff.restTo };
}
