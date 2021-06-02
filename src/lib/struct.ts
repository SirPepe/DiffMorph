// Finds structures in diff tokens. This can be logical language constructs as
// well as lines of code.

import { groupBy } from "@sirpepe/shed";
import { diffArrays } from "diff";
import { DiffTokens, Token } from "../types";
import { DiffOp, MOV } from "./diff";
import { pickAlternative } from "./heuristics";
import { findMaxValue, hash } from "./util";

// May encapsulate a language construct or any other sort of softer logical
// structure (a block, a function body etc)
export type Structure = Token & {
  readonly type: string;
  readonly hash: number;
  readonly items: DiffTokens[];
  readonly structures: Structure[];
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

// Take items from "items", starting at index "from" until "done" returns either
// true or null (the latter signalling an abort)
function consume(
  items: DiffTokens[],
  from: number,
  done: (item: DiffTokens) => boolean | null // null = abort
): { result: DiffTokens[]; position: number } {
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

export function findStructures(items: DiffTokens[]): Structure[] {
  const structures: Structure[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const structMatch = /(.*)-start-(\d)+$/.exec(item.type);
    if (structMatch && structMatch.length === 3) {
      const [, type, level] = structMatch;
      const { result, position } = consume(items, i, (next) => {
        if (next.parent !== item.parent) {
          return null;
        }
        if (next.type.match(new RegExp(`${type}-end-${level}`))) {
          return true;
        }
        return false;
      });
      if (result.length > 0) {
        const { x, y } = result[0];
        structures.push({
          x,
          y,
          width: findMaxValue(result, (item) => item.x + item.width - x),
          height: findMaxValue(result, (item) => item.y + item.height - y),
          type,
          hash: hashItems(result),
          items: result,
          structures: findStructures(result.slice(1, -1)),
        });
      }
      i = position;
    }
  }
  return structures;
}

function findRest<T>(items: T[], containers: { items: T[] }[]): T[] {
  return items.filter(
    (item) => !containers.some((container) => container.items.includes(item))
  );
}

// Organize tokens into lines, which are just a special case of structure
function asLines(tokens: DiffTokens[]): Structure[] {
  const byLine = groupBy(tokens, "y");
  return Array.from(byLine, ([y, items]) => {
    const hash = hashItems(items);
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
function shiftStructure(from: Structure, to: Structure): MOV<DiffTokens>[] {
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
  from: Structure[],
  to: Structure[]
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
        result.push(...shiftStructure(previous, structure));
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
  const fromStructures = findStructures(fromTokens);
  const toStructures = findStructures(toTokens);
  // Not every token is part of a structure. The restFrom/restTo arrays returned
  // by diffStructures() only contain the tokens that could not be assigned in
  // the diffing process.
  const remainingFrom = findRest(fromTokens, fromStructures);
  const remainingTo = findRest(toTokens, toStructures);
  const structureDiff = diffStructures(fromStructures, toStructures);
  remainingFrom.push(...structureDiff.restFrom);
  remainingTo.push(...structureDiff.restTo);
  result.push(...structureDiff.result);
  // Second pass: diff lines of remaining tokens
  const lineDiff = diffStructures(asLines(remainingFrom), asLines(remainingTo));
  result.push(...lineDiff.result);
  return { result, restFrom: lineDiff.restFrom, restTo: lineDiff.restTo };
}
