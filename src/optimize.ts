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
      movements.push({ type: "MOV", item: alternative.item, ref: deletion.item });
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

function pickAlternative<T extends TokenLike>(
  deletion: DEL<T>,
  candidates: Set<ADD<T>>
): ADD<T> | null {
  if (candidates.size === 1) {
    return Array.from(candidates)[0];
  }
  return null;
}
