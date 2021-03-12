// This module attempts to make morphs nicer by turning addition/removal pairs
// into movements. There is no real high-level concept to this - it's just a
// bunch of heuristics applied in a brute-force manner.

import { ADD, DEL, MOV, DiffOp } from "./diff";
import { findMin } from "./util";
import { TokenLike } from "../types";

export function optimize<T extends TokenLike>(
  diffs: DiffOp<T>[][]
): DiffOp<T>[][] {
  return diffs.map(optimizeFrame);
}

function optimizeFrame<T extends TokenLike>(diff: DiffOp<T>[]): DiffOp<T>[] {
  const byHash: Record<string, [Set<MOV<T>>, Set<ADD<T>>, Set<DEL<T>>]> = {};
  for (const op of diff) {
    if (!byHash[op.item.hash]) {
      byHash[op.item.hash] = [new Set(), new Set(), new Set()];
    }
    if (op.type == "MOV") {
      byHash[op.item.hash][0].add(op);
    } else if (op.type == "ADD") {
      byHash[op.item.hash][1].add(op);
    } else if (op.type === "DEL") {
      byHash[op.item.hash][2].add(op);
    }
  }
  const result: DiffOp<T>[] = [];
  for (const [MOV, ADD, DEL] of Object.values(byHash)) {
    if (ADD.size === 0 || DEL.size === 0) {
      result.push(...MOV, ...ADD, ...DEL);
    } else {
      result.push(...MOV, ...resolveOptimizations(ADD, DEL));
    }
  }
  return result;
}

function resolveOptimizations<T extends TokenLike>(
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
        ref: deletion.item,
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

function getOffset(item: TokenLike): Offset {
  const { x: left, y: top, size } = item;
  let bottom: number | undefined = undefined;
  let right: number | undefined = undefined;
  while (true) {
    if (!item.next) {
      bottom = item.y - top;
      break;
    }
    if (typeof bottom === "undefined" && item.next.y === top + 1) {
      right = item.x + item.size - left + size;
    }
    item = item.next;
  }
  bottom = bottom || 0;
  right = right || 0;
  return { top, left, bottom, right };
}

function pickAlternative<T extends TokenLike>(
  deletion: DEL<T>,
  additions: Set<ADD<T>>
): ADD<T> | null {
  // Too easy
  if (additions.size === 1) {
    return Array.from(additions)[0];
  }
  // Setup and pre-calulate data for picking the best alternative
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
