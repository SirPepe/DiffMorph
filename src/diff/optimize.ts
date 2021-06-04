// This module attempts to make morphs nicer by turning addition/removal pairs
// of equivalent tokens into movements. There is no real high-level concept to
// this - it's just a bunch of heuristics applied in a brute-force manner.

import { mapBy } from "@sirpepe/shed";
import { DiffTokens, Token } from "../types";
import { DiffTree, MOV, ADD, DEL, DiffOp } from "../lib/diff";
import { pickAlternative } from "./heuristics";

// "next" and "prev" are useful inputs to the optimizer, but they must not be
// strictly required, otherwise only linked list members can be optimized and
// stuff like structures or decorations can't.
export type Optimizable = Token & {
  hash: any;
  prev?: Optimizable | undefined;
  next?: Optimizable | undefined;
};

export function optimizeDiffs(diffs: DiffTree[]): DiffTree[] {
  return diffs.map(optimizeDiff);
}

function optimizeDiff(diff: DiffTree): DiffTree {
  const result: DiffTree = {
    ...diff,
    content: optimizeOperations(diff.content),
    decorations: optimizeOperations(diff.decorations),
  };
  return result;
}

function optimizeOperations<T extends Optimizable>(
  operations: DiffOp<T>[]
): DiffOp<T>[];
function optimizeOperations(
  operations: (DiffTree | DiffOp<DiffTokens>)[]
): (DiffTree | DiffOp<DiffTokens>)[];
function optimizeOperations<T extends Optimizable>(
  operations: (DiffTree | DiffOp<T>)[]
): (DiffTree | DiffOp<T>)[] {
  const trees: DiffTree[] = [];
  const byHash: Record<string, [Set<MOV<T>>, Set<ADD<T>>, Set<DEL<T>>]> = {};
  for (const operation of operations) {
    if (operation.kind === "TREE") {
      trees.push(optimizeDiff(operation));
    } else {
      if (!byHash[operation.item.hash]) {
        byHash[operation.item.hash] = [new Set(), new Set(), new Set()];
      }
      if (operation.kind == "MOV") {
        byHash[operation.item.hash][0].add(operation);
      } else if (operation.kind == "ADD") {
        byHash[operation.item.hash][1].add(operation);
      } else if (operation.kind === "DEL") {
        byHash[operation.item.hash][2].add(operation);
      }
    }
  }
  const result = [];
  for (const [MOV, ADD, DEL] of Object.values(byHash)) {
    if (ADD.size === 0 || DEL.size === 0) {
      result.push(...MOV, ...ADD, ...DEL);
    } else {
      result.push(...MOV, ...resolveOptimizations(ADD, DEL));
    }
  }
  result.push(...trees);
  return result;
}

// Note that the input sets "additions" and "deletions" get both mutated by this
// function and also note that this function is quite inefficient - all this
// converting of data structures stems from a refactoring that generalized
// pickAlternative() to make it work with the Pattern data structure in the diff
// module. This function (or rather this entire module) should be updated to
// bring it more into line with the new pickAlternative().
function resolveOptimizations<T extends Optimizable>(
  additions: Set<ADD<T>>,
  deletions: Set<DEL<T>>
): DiffOp<T>[] {
  const movements: MOV<T>[] = [];
  const additionsByItem = mapBy(additions, "item");
  for (const deletion of deletions) {
    const [alternative] = pickAlternative(
      deletion.item,
      Array.from(additions, (op) => op.item)
    );
    if (alternative) {
      movements.push({
        kind: "MOV",
        item: alternative,
        from: deletion.item,
      });
      additions.delete(additionsByItem.get(alternative) as ADD<T>);
      deletions.delete(deletion);
      if (additions.size === 0) {
        break;
      }
      continue;
    }
  }
  return [...additions, ...deletions, ...movements];
}
