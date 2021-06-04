// Finds structures in diff tokens. This can be logical language constructs as
// well as lines of code.

import { groupBy } from "@sirpepe/shed";
import { diffArrays } from "diff";
import { offsetHashChain } from "../diff/hash";
import { findStructs, Struct } from "../diff/structs";
import { DiffTokens, DiffOp, MOV } from "../types";
import { pickAlternative } from "../diff/heuristics";

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
