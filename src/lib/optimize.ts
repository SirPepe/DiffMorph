// This module attempts to make morphs nicer by turning addition/removal pairs
// into movements. There is no real high-level concept to this - it's just a
// bunch of heuristics applied in a brute-force manner.

import { Box } from "../types";
import { DiffTree, Diffable, MOV, ADD, DEL, DiffOp } from "./diff";
import { findMin } from "./util";

export type Optimizable = Diffable & {
  parent: Box<any>;
  size: number;
};

export function optimize<T extends Optimizable>(
  diffs: DiffTree<T>[]
): DiffTree<T>[] {
  return diffs.map(optimizeFrame);
}

function optimizeFrame<T extends Optimizable>(diff: DiffTree<T>): DiffTree<T> {
  const trees: DiffTree<T>[] = [];
  const byHash: Record<string, [Set<MOV<T>>, Set<ADD<T>>, Set<DEL<T>>]> = {};
  for (const operation of diff.items) {
    if (operation.type === "TREE") {
      trees.push(optimizeFrame(operation));
    } else {
      if (!byHash[operation.item.hash]) {
        byHash[operation.item.hash] = [new Set(), new Set(), new Set()];
      }
      if (operation.type == "MOV") {
        byHash[operation.item.hash][0].add(operation);
      } else if (operation.type == "ADD") {
        byHash[operation.item.hash][1].add(operation);
      } else if (operation.type === "DEL") {
        byHash[operation.item.hash][2].add(operation);
      }
    }
  }
  const result: DiffTree<T> = { ...diff, items: [] };
  for (const [MOV, ADD, DEL] of Object.values(byHash)) {
    if (ADD.size === 0 || DEL.size === 0) {
      result.items.push(...MOV, ...ADD, ...DEL);
    } else {
      result.items.push(...MOV, ...resolveOptimizations(ADD, DEL));
    }
  }
  return result;
}

function resolveOptimizations<T extends Optimizable>(
  additions: Set<ADD<T>>,
  deletions: Set<DEL<T>>
): DiffOp<T>[] {
  const movements: MOV<T>[] = [];
  for (const deletion of deletions) {
    const alternative = pickAlternative(deletion, additions);
    if (alternative) {
      movements.push({
        type: "MOV",
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

function getOffset(item: Optimizable): Offset {
  const { x: left, y: top, size } = item;
  const bottom = item.parent.height - 1 - top;
  const right = item.parent.width - size - left;
  return { top, left, bottom, right };
}

function pickAlternative<T extends Optimizable>(
  deletion: DEL<T>,
  additions: Set<ADD<T>>
): ADD<T> | null {
  // Too easy
  if (additions.size === 1) {
    return Array.from(additions)[0];
  }
  // Setup and pre-calculate data for picking the best alternative
  const offset = getOffset(deletion.item);
  const sameLineCandidates = new Map<ADD<T>, Offset>();
  const allCandidates = new Map<ADD<T>, Offset>();
  for (const addition of additions) {
    const additionOffset = getOffset(addition.item);
    if (additionOffset.top === offset.top) {
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
    if (offset.right === right) {
      return candidate;
    }
  }
  // Try to find an alternative that's the closest on the same line
  if (sameLineCandidates.size > 0) {
    const [closest] = findMin(sameLineCandidates, ([, candidateOffset]) => {
      return Math.abs(candidateOffset.left - offset.left);
    });
    return closest;
  }
  // Last attempt: take whatever is closest
  return findMin(allCandidates, ([, candidateOffset]) => {
    const deltaX = Math.abs(candidateOffset.left - offset.left);
    const deltaY = Math.abs(candidateOffset.top - offset.top);
    return deltaX + deltaY;
  })[0];
}
