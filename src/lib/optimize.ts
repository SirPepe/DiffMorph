// This module attempts to make morphs nicer by turning addition/removal pairs
// into movements. There is no real high-level concept to this - it's just a
// bunch of heuristics applied in a brute-force manner.

import { Box, Token } from "../types";
import { DiffTree, MOV, ADD, DEL, DiffOp } from "./diff";
import { findMaxValue, findMin } from "./util";

export type Optimizable = Token & { parent: Box<any, any> };

export function optimizeDiffs<T extends Optimizable, D extends Optimizable>(
  diffs: DiffTree<T, D>[]
): DiffTree<T, D>[] {
  return diffs.map(optimizeDiff);
}

function optimizeDiff<T extends Optimizable, D extends Optimizable>(
  diff: DiffTree<T, D>
): DiffTree<T, D> {
  const result: DiffTree<T, D> = {
    ...diff,
    content: optimizeOperations(diff.content),
    decorations: optimizeOperations(diff.decorations),
  };
  return result;
}

function optimizeOperations<T extends Optimizable>(
  operations: DiffOp<T>[]
): DiffOp<T>[];
function optimizeOperations<T extends Optimizable, D extends Optimizable>(
  operations: (DiffTree<T, D> | DiffOp<T>)[]
): (DiffTree<T, D> | DiffOp<T>)[];
function optimizeOperations<T extends Optimizable, D extends Optimizable>(
  operations: (DiffTree<T, D> | DiffOp<T>)[]
): (DiffTree<T, D> | DiffOp<T>)[] {
  const trees: DiffTree<T, D>[] = [];
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
// function
function resolveOptimizations<T extends Optimizable>(
  additions: Set<ADD<T>>,
  deletions: Set<DEL<T>>
): DiffOp<T>[] {
  const movements: MOV<T>[] = [];
  for (const deletion of deletions) {
    const alternative = pickAlternative(deletion, additions);
    if (alternative) {
      movements.push({
        kind: "MOV",
        item: alternative.item,
        from: deletion.item,
      });
      additions.delete(alternative);
      deletions.delete(deletion);
      continue;
    }
    if (additions.size === 0) {
      break;
    }
  }
  return [...additions, ...deletions, ...movements];
}

type Offset = {
  top: number;
  left: number;
  bottom: number;
  right: number;
};

function getOffset(
  item: Optimizable,
  referenceWidth: number,
  referenceHeight: number
): Offset {
  const { x: left, y: top, width, height } = item;
  const right = referenceWidth - left - width;
  const bottom = referenceHeight - top - height;
  const offset = { top, left, bottom, right };
  return offset;
}

function pickAlternative<T extends Optimizable>(
  deletion: DEL<T>,
  additions: Set<ADD<T>>
): ADD<T> | null {
  // Too easy
  if (additions.size === 1) {
    return Array.from(additions)[0];
  }
  // Setup and pre-calculate data for picking the best alternative. Compute all
  // offsets based on the largest possible parent box, otherwise right and
  // bottom offsets may not be comparable.
  const refWidth = findMaxValue(
    [deletion, ...additions],
    ({ item }) => item.parent.width
  );
  const refHeight = findMaxValue(
    [deletion, ...additions],
    ({ item }) => item.parent.height
  );
  const deletionOffset = getOffset(deletion.item, refWidth, refHeight);
  const sameLineCandidates = new Map<ADD<T>, Offset>();
  const allCandidates = new Map<ADD<T>, Offset>();
  for (const addition of additions) {
    const additionOffset = getOffset(addition.item, refWidth, refHeight);
    if (additionOffset.top === deletionOffset.top) {
      sameLineCandidates.set(addition, additionOffset);
    }
    allCandidates.set(addition, additionOffset);
  }
  // If there is exactly one alternative on the same line, just pick that
  if (sameLineCandidates.size === 1) {
    return Array.from(sameLineCandidates.keys())[0];
  }
  // Try to find an alternative with the same offset from right of the same line
  for (const [candidate, { right }] of sameLineCandidates) {
    if (deletionOffset.right === right) {
      return candidate;
    }
  }
  // Try to find an alternative that's the closest on the same line
  if (sameLineCandidates.size > 0) {
    const [closest] = findMin(sameLineCandidates, ([, candidateOffset]) => {
      return Math.abs(candidateOffset.left - deletionOffset.left);
    });
    return closest;
  }
  // Last attempt: take whatever is closest
  return findMin(allCandidates, ([, candidateOffset]) => {
    const deltaX = Math.abs(candidateOffset.left - deletionOffset.left);
    const deltaY = Math.abs(candidateOffset.top - deletionOffset.top);
    return deltaX + deltaY;
  })[0];
}
