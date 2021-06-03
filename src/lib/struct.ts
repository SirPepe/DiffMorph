// Finds structures in diff tokens. This can be logical language constructs as
// well as lines of code.

import { groupBy } from "@sirpepe/shed";
import { diffArrays } from "diff";
import { findStructs, Struct } from "../diff/structs";
import { DiffTokens } from "../types";
import { DiffOp, MOV } from "./diff";
import { pickAlternative } from "./heuristics";
import { hash } from "./util";

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

// Organize tokens into lines, which are just a special case of structure
function asLines(tokens: DiffTokens[]): Struct[] {
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
function shiftStructure(from: Struct, to: Struct): MOV<DiffTokens>[] {
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
