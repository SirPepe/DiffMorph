// This module attempts to make morphs nicer by turning addition/removal pairs
// into movements.

import { ADD, DEL, MOV, DiffOp } from "./diff";
import { TokenLike } from "./types";

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
  // nthFromStartOfLine: number;
  // nthFromEndOfLine: number;
}

function getOffset(
  item: TokenLike
): Offset {
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
  if (additions.size === 1) {
    return Array.from(additions)[0];
  }
  const offset = getOffset(deletion.item);
  const candidates = new Map(Array.from(additions, (addition) => {
    return [ addition, getOffset(addition.item) ];
  }));
  // First attempt: try to find an alternative with the same offset from the end
  // of the same line
  for (const [candidate, { right }] of candidates) {
    if (candidate.item.y === deletion.item.y && offset.right === right) {
      return candidate;
    }
  }
  // Last attempt: take whatever is closest
  return null;
}
